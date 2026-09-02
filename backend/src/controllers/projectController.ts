//path: backend/src/controllers/projectController.ts
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Project, { PROJECT_CATEGORIES } from '../models/Project';
import Task from '../models/Task';
import InvoiceSequence from '../models/InvoiceSequence';
import { createTimelineEvent, getEntityTimeline } from '../utils/timelineHelper';
import { WorkflowProjectIntegration } from '../services/workflowProjectIntegration';
import { getAccessibleProjectIdsForUser, resolveProjectAccess } from '../middleware/projectAccess.middleware';
import NotificationEmitter from '../utils/notificationEmitter';
import { getCachedProjectList, setCachedProjectList, invalidateProjectListCache } from '../utils/projectCache';
import { logger } from '../utils/logger';
import { emitProjectStats } from '../utils/socketEvents';
import { computeProjectProgress } from '../utils/projectProgress';
import { parseListParams, escapeRegex } from '../utils/helpers';
import { isValidProjectStatusTransition, allowedProjectStatusTransitions, findProjectDependencyCycle } from '../utils/projectValidation';
// Socket will be imported dynamically to avoid circular dependency

const PROJECT_SORT_MAP: Record<string, Record<string, 1 | -1>> = {
  recent: { updatedAt: -1 },
  created: { createdAt: -1 },
  name: { name: 1 },
  endDate: { endDate: 1 },
  startDate: { startDate: 1 },
  progress: { progress: -1 }
};

const JOB_NUMBER_PREFIX = 'JOB';

/**
 * Next job number in the register, e.g. JOB-2026-00014. Uses the same atomic
 * counter collection as invoice numbering, keyed on its own prefix, so two
 * concurrent creates cannot land on the same number.
 */
export const generateProjectJobNumber = async (): Promise<string> => {
  const now = new Date();
  const year = now.getFullYear();
  const sequence = await InvoiceSequence.findOneAndUpdate(
    { prefix: JOB_NUMBER_PREFIX, year, month: null },
    { $inc: { currentNumber: 1 }, lastGeneratedAt: now },
    { upsert: true, new: true }
  );
  return `${JOB_NUMBER_PREFIX}-${year}-${String(sequence.currentNumber).padStart(5, '0')}`;
};

const toObjectIdOrUndefined = (value: any): mongoose.Types.ObjectId | undefined =>
  value && mongoose.Types.ObjectId.isValid(value) ? new mongoose.Types.ObjectId(value) : undefined;

const parseSiteLocation = (value: any) => {
  if (!value || typeof value !== 'object') return undefined;
  const location = {
    address: typeof value.address === 'string' ? value.address.trim() : undefined,
    city: typeof value.city === 'string' ? value.city.trim() : undefined,
    state: typeof value.state === 'string' ? value.state.trim() : undefined,
    pincode: typeof value.pincode === 'string' ? value.pincode.trim() : undefined,
    country: typeof value.country === 'string' ? value.country.trim() : undefined
  };
  return Object.values(location).some(Boolean) ? location : undefined;
};

const parseProjectCategory = (value: any) =>
  typeof value === 'string' && (PROJECT_CATEGORIES as readonly string[]).includes(value)
    ? value
    : undefined;

const parseOptionalDate = (value: any): Date | undefined => {
  if (!value) return undefined;
  const date = new Date(value);
  return isNaN(date.getTime()) ? undefined : date;
};

/**
 * Recompute a project's planned and actual man-hours from the four places
 * hours are captured, and persist the rollup on the project.
 *
 *   planned  task estimates + resource allocations
 *   actual   logged task time + daily-report hours + attendance booked to the
 *            project (approved rows only, so pending requests do not inflate it)
 *
 * Task time entries and daily reports can describe the same hours, so the
 * larger of the two is taken rather than their sum.
 */
export const rollUpProjectManHours = async (projectId: string) => {
  const [ResourceAllocation, DailyReport, Attendance] = await Promise.all([
    import('../models/ResourceAllocation').then(m => m.default),
    import('../models/DailyReport').then(m => m.default),
    import('../models/Attendance').then(m => m.default)
  ]);

  const projectObjectId = new mongoose.Types.ObjectId(projectId);

  const [taskTotals, allocationTotals, reportTotals, attendanceTotals] = await Promise.all([
    Task.aggregate([
      { $match: { project: projectObjectId } },
      {
        $group: {
          _id: null,
          estimated: { $sum: { $ifNull: ['$estimatedHours', 0] } },
          logged: { $sum: { $ifNull: ['$actualHours', 0] } }
        }
      }
    ]),
    ResourceAllocation.aggregate([
      { $match: { project: projectObjectId } },
      {
        $group: {
          _id: null,
          allocated: { $sum: { $ifNull: ['$allocatedHours', 0] } },
          actual: { $sum: { $ifNull: ['$actualHours', 0] } }
        }
      }
    ]),
    DailyReport.aggregate([
      { $match: { project: projectObjectId, status: { $ne: 'draft' } } },
      { $group: { _id: null, hours: { $sum: { $ifNull: ['$totalHours', 0] } } } }
    ]),
    Attendance.aggregate([
      {
        $match: {
          project: projectObjectId,
          approvalStatus: { $in: ['approved', 'auto-approved'] }
        }
      },
      { $group: { _id: null, hours: { $sum: { $ifNull: ['$totalHours', 0] } } } }
    ])
  ]);

  const estimated = taskTotals[0]?.estimated || 0;
  const allocated = allocationTotals[0]?.allocated || 0;
  const loggedOnTasks = Math.max(taskTotals[0]?.logged || 0, allocationTotals[0]?.actual || 0);
  const reportedHours = reportTotals[0]?.hours || 0;
  const attendanceHours = attendanceTotals[0]?.hours || 0;

  const planned = Math.round(estimated + allocated);
  const actual = Math.round(Math.max(loggedOnTasks, reportedHours) + attendanceHours);

  await Project.findByIdAndUpdate(projectId, {
    'manHours.planned': planned,
    'manHours.actual': actual,
    'manHours.lastCalculatedAt': new Date()
  });

  return { planned, actual };
};

const PROJECT_LIST_POPULATE = [
  { path: 'managers', select: 'name email', strictPopulate: false },
  { path: 'team', select: 'name email', strictPopulate: false },
  { path: 'owner', select: 'name email', strictPopulate: false },
  { path: 'departments', select: 'name description', strictPopulate: false },
  { path: 'clientContact', select: 'name company email phone address', strictPopulate: false }
];

// Fields a user may see for a project they are not assigned to but can reach
// through a department-level projects.view grant.
const PROJECT_BASIC_FIELDS = [
  '_id',
  'name',
  'jobNumber',
  'status',
  'priority',
  'startDate',
  'endDate',
  'departments'
] as const;

const toBasicProject = (project: any) => {
  const basic: any = { isBasicView: true };
  for (const field of PROJECT_BASIC_FIELDS) basic[field] = project[field];
  return basic;
};

// Translates status/priority/tag/search query params into a Mongo filter.
// Every value is validated against the schema's own enums rather than passed
// through, and free text is regex-escaped before it reaches the query.
const buildProjectFilter = (query: any, search: string | null) => {
  const filter: any = {};

  const validStatuses = ['planning', 'active', 'on-hold', 'completed', 'archived', 'cancelled'];
  const validPriorities = ['low', 'medium', 'high', 'critical'];

  const statuses = String(query.status || '')
    .split(',')
    .map(s => s.trim())
    .filter(s => validStatuses.includes(s));
  if (statuses.length) filter.status = { $in: statuses };

  const priorities = String(query.priority || '')
    .split(',')
    .map(p => p.trim())
    .filter(p => validPriorities.includes(p));
  if (priorities.length) filter.priority = { $in: priorities };

  if (typeof query.projectType === 'string' && ['instruction', 'reporting'].includes(query.projectType)) {
    filter.projectType = query.projectType;
  }

  if (typeof query.tag === 'string' && query.tag.trim()) {
    filter.tags = query.tag.trim();
  }

  // Past their end date and not already closed out. Combines with an explicit
  // status filter rather than replacing it.
  if (query.overdue === 'true') {
    filter.endDate = { $lt: new Date() };
    const closed = ['completed', 'cancelled', 'archived'];
    filter.status = filter.status ? { ...filter.status, $nin: closed } : { $nin: closed };
  }

  if (search) {
    const pattern = new RegExp(escapeRegex(search), 'i');
    filter.$and = [{ $or: [{ name: pattern }, { client: pattern }] }];
  }

  return filter;
};

export const getAllProjects = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { page, limit, skip, paginate, search, sort } = parseListParams(req.query, {
      sortMap: PROJECT_SORT_MAP,
      defaultSort: 'recent'
    });

    const filter: any = buildProjectFilter(req.query, search);

    // Owner / manager / team membership plus explicit ProjectPermission grants.
    // `all` is true only for users who genuinely see every project.
    const access = await getAccessibleProjectIdsForUser(user);

    // SECURITY: the shared 'all' scope may only be used when access resolution
    // returned every project; everyone else is keyed per user so one user's
    // list is never served to another.
    const scope = access.all ? 'all' : `u:${user._id.toString()}`;
    const queryKey = JSON.stringify({
      status: filter.status?.$in ?? [],
      priority: filter.priority?.$in ?? [],
      projectType: filter.projectType ?? '',
      tag: filter.tags ?? '',
      overdue: req.query.overdue === 'true',
      search: search ?? '',
      sort,
      page: paginate ? page : 0,
      limit: paginate ? limit : 0
    });

    const cached = await getCachedProjectList(scope, queryKey);
    if (cached !== null) {
      return res.json(cached);
    }

    // Ids the user is directly attached to; everything else they can reach is
    // department-derived and returned in the reduced shape.
    let assignedIds: Set<string> | null = null;

    if (!access.all) {
      const accessConditions: any[] = [{ _id: { $in: access.ids } }];
      assignedIds = new Set(access.ids.map(id => id.toString()));

      const Employee = (await import('../models/Employee')).default;
      const Department = (await import('../models/Department')).default;
      const employee = await Employee.findOne({ user: user._id }).select('department departments').lean();

      if (employee) {
        const departmentNames = employee.departments?.length
          ? employee.departments
          : (employee.department ? [employee.department] : []);

        if (departmentNames.length > 0) {
          const departments = await Department.find({
            name: { $in: departmentNames },
            status: 'active'
          }).select('_id permissions').lean();

          const grantsProjectView = departments.some(
            dept => dept.permissions && dept.permissions.includes('projects.view')
          );

          // Project.departments holds Department ids, while Employee.departments
          // holds names, so the ids have to be resolved before matching.
          if (grantsProjectView && departments.length) {
            accessConditions.push({ departments: { $in: departments.map(d => d._id) } });
          }
        }
      }

      filter.$and = [...(filter.$and || []), { $or: accessConditions }];
    }

    const query = Project.find(filter)
      .sort(sort)
      .populate(PROJECT_LIST_POPULATE)
      .lean();

    if (paginate) query.skip(skip).limit(limit);

    const [projects, total] = await Promise.all([
      query.exec(),
      paginate ? Project.countDocuments(filter) : Promise.resolve(0)
    ]);

    const shaped = assignedIds
      ? projects.map(p => (assignedIds!.has(p._id.toString()) ? p : toBasicProject(p)))
      : projects;

    if (!paginate) {
      // Unparameterised calls keep the original bare-array contract.
      await setCachedProjectList(scope, queryKey, shaped);
      return res.json(shaped);
    }

    const payload = {
      success: true,
      data: shaped,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    };

    await setCachedProjectList(scope, queryKey, payload);
    return res.json(payload);
  } catch (error) {
    logger.error('Error fetching projects', { message: error?.message });
    res.status(500).json({ success: false, message: 'Error fetching projects' });
  }
};

// Id/name pairs for pickers and dropdowns, which need every project the user
// can see but none of the detail. Mirrors the existing /employees/minimal and
// /departments/minimal endpoints.
export const getProjectsMinimal = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const roleName = typeof user.role === 'object' && 'name' in user.role ? user.role.name : null;
    const rolePermissions = (typeof user.role === 'object' && 'permissions' in user.role ? user.role.permissions : []) as string[];
    const seesEverything = roleName === 'Root' || rolePermissions.includes('projects.view_all');

    const filter: any = seesEverything
      ? {}
      : { $or: [{ owner: user._id }, { team: user._id }, { managers: user._id }] };

    const projects = await Project.find(filter)
      .select('name jobNumber status')
      .sort({ name: 1 })
      .lean();

    res.json({ success: true, data: projects });
  } catch (error) {
    logger.error('Error fetching minimal projects', { message: error?.message });
    res.status(500).json({ success: false, message: 'Error fetching projects' });
  }
};

export const getProjectById = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const userRole = user.role as any;
    const roleName = typeof user.role === 'object' && 'name' in user.role ? user.role.name : null;
    const rolePermissions = (typeof user.role === 'object' && 'permissions' in user.role ? user.role.permissions : []) as string[];
    
    // Root or users with projects.view_all permission get full access
    if (roleName === 'Root' || rolePermissions.includes('projects.view_all')) {
      const project = await Project.findById(req.params.id)
        .populate({ path: 'managers', select: 'name email', strictPopulate: false })
        .populate({ path: 'team', select: 'name email', strictPopulate: false })
        .populate({ path: 'owner', select: 'name email', strictPopulate: false })
        
        .populate({ path: 'departments', select: 'name description', strictPopulate: false })
        .populate({ path: 'clientContact', select: 'name company email phone address', strictPopulate: false });
      
      if (!project) {
        return res.status(404).json({ success: false, message: 'Project not found' });
      }
      return res.json({ success: true, data: project });
    }

    const project = await Project.findById(req.params.id)
      .populate({ path: 'managers', select: 'name email', strictPopulate: false })
      .populate({ path: 'team', select: 'name email', strictPopulate: false })
      .populate({ path: 'owner', select: 'name email', strictPopulate: false })
      
      .populate({ path: 'departments', select: 'name description', strictPopulate: false })
      .populate({ path: 'clientContact', select: 'name company email phone address', strictPopulate: false });
    
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Check if user is assigned to project
    
    const isOwner = project.owner && project.owner._id && project.owner._id.toString() === user._id.toString();
    const userIdStr = user._id.toString();
    const isTeamMember = !!(project.team && project.team.some((t: any) => (t?._id?.toString() || t?.toString()) === userIdStr));
    const isManager = !!(project.managers && project.managers.some((m: any) => (m?._id?.toString() || m?.toString()) === userIdStr));

    // Employee record only needed for the department-based fallback below
    const Employee = (await import('../models/Employee')).default;
    const employee = await Employee.findOne({ user: user._id });

    const isAssigned = isOwner || isTeamMember || isManager;
    
    // If assigned, return full project details
    if (isAssigned) {
      return res.json({ success: true, data: project });
    }
    
    // Check department permission for basic view
    if (employee) {
      const Department = (await import('../models/Department')).default;
      const departmentNames = employee.departments || (employee.department ? [employee.department] : []);
      
      if (departmentNames.length > 0) {
        const departments = await Department.find({ name: { $in: departmentNames }, status: 'active' });
        const hasProjectViewPermission = departments.some(dept => 
          dept.permissions && dept.permissions.includes('projects.view')
        );
        
        // Check if project belongs to user's department
        const projectDepartments = project.departments.map((d: any) => (d && typeof d === 'object' && d.name) ? d.name : d.toString());
        const hasAccessToDepartment = departmentNames.some(dept => projectDepartments.includes(dept));
        
        if (hasProjectViewPermission && hasAccessToDepartment) {
          // Return basic project info only
          return res.json({
            success: true,
            data: {
              _id: project._id,
              name: project.name,
              status: project.status,
              priority: project.priority,
              startDate: project.startDate,
              endDate: project.endDate,
              departments: project.departments,
              isBasicView: true
            }
          });
        }
      }
    }
    
    return res.status(403).json({ success: false, message: 'Access denied: You are not assigned to this project' });
  } catch (error) {
    logger.error('Error fetching project by ID', { message: error?.message });
    res.status(500).json({ success: false, message: 'Error fetching project', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const createProject = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    // Validate required fields only
    const { name, description, startDate, endDate } = req.body;
    if (!name?.trim() || !description?.trim() || !startDate || !endDate) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name, description, start date, and end date are required' 
      });
    }

    // Create project with minimal data processing
    const projectData = {
      name: name.trim(),
      description: description.trim(),
      projectType: req.body.projectType || 'instruction',
      status: req.body.status || 'planning',
      priority: req.body.priority || 'medium',
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      budget: parseFloat(req.body.budget) || 0,
      currency: req.body.currency || 'USD',
      progress: Math.min(Math.max(parseInt(req.body.progress) || 0, 0), 100),
      progressMode: req.body.projectType === 'reporting' ? 'financial' : (req.body.progressMode || 'task-based'),
      client: req.body.client?.trim() || undefined,
      manager: req.body.managers && req.body.managers.length > 0 ? req.body.managers[0] : req.body.manager,
      managers: Array.isArray(req.body.managers) ? req.body.managers : (req.body.manager ? [req.body.manager] : []),
      team: Array.isArray(req.body.team) ? req.body.team : [],
      departments: Array.isArray(req.body.departments) ? req.body.departments : [],
      tags: Array.isArray(req.body.tags) ? req.body.tags : [],
      owner: user._id,
      risks: Array.isArray(req.body.risks) ? req.body.risks : [],
      dependencies: Array.isArray(req.body.dependencies) ? req.body.dependencies : [],
      instructions: Array.isArray(req.body.instructions) ? req.body.instructions : [],
      projectCategory: parseProjectCategory(req.body.projectCategory) || 'other',
      clientContact: toObjectIdOrUndefined(req.body.clientContact),
      siteLocation: parseSiteLocation(req.body.siteLocation),
      tender: toObjectIdOrUndefined(req.body.tender),
      actualStartDate: parseOptionalDate(req.body.actualStartDate),
      actualEndDate: parseOptionalDate(req.body.actualEndDate)
    };

    // A supplied job number wins so an existing register can be carried over;
    // otherwise the next number in the sequence is allocated.
    const suppliedJobNumber = typeof req.body.jobNumber === 'string' ? req.body.jobNumber.trim() : '';
    if (suppliedJobNumber) {
      const duplicate = await Project.findOne({ jobNumber: suppliedJobNumber.toUpperCase() })
        .select('_id')
        .setOptions({ includeDeleted: true });
      if (duplicate) {
        return res.status(409).json({
          success: false,
          message: `Job number ${suppliedJobNumber} is already in use`
        });
      }
      (projectData as any).jobNumber = suppliedJobNumber;
    } else {
      (projectData as any).jobNumber = await generateProjectJobNumber();
    }

    // The plan the project starts on is its baseline, so later revisions to
    // startDate/endDate/budget stay measurable against something.
    (projectData as any).baseline = {
      startDate: projectData.startDate,
      endDate: projectData.endDate,
      contractValue: projectData.budget,
      manHours: Number(req.body.baselineManHours) > 0 ? Number(req.body.baselineManHours) : undefined,
      source: 'manual',
      capturedAt: new Date()
    };

    // Create and save project
    const project = new Project(projectData);
    await project.save();

    await invalidateProjectListCache();

    // Create the initial phases, if the caller supplied any
    if (Array.isArray(req.body.phases) && req.body.phases.length > 0) {
      try {
        const ProjectPhase = (await import('../models/ProjectPhase')).default;
        await ProjectPhase.insertMany(req.body.phases.map((phase: any, index: number) => ({
          project: project._id,
          name: String(phase.name || `Phase ${index + 1}`).trim(),
          description: phase.description?.trim(),
          order: Number.isFinite(Number(phase.order)) ? Number(phase.order) : index,
          startDate: phase.startDate ? new Date(phase.startDate) : undefined,
          endDate: phase.endDate ? new Date(phase.endDate) : undefined,
          budget: parseFloat(phase.budget) || 0,
          milestones: Array.isArray(phase.milestones) ? phase.milestones : [],
          reviewDepartments: Array.isArray(phase.reviewDepartments) ? phase.reviewDepartments : [],
          createdBy: user._id
        })));
      } catch (phaseError) {
        logger.error('Error creating project phases', { message: (phaseError as any)?.message });
        // Phases can be added afterwards; don't fail the project creation
      }
    }

    // Handle project permissions if provided
    if (req.body.projectPermissions && Object.keys(req.body.projectPermissions).length > 0) {
      try {
        const ProjectPermission = (await import('../models/ProjectPermission')).default;
        const permissionPromises = Object.entries(req.body.projectPermissions).map(([userId, permissions]) => {
          return ProjectPermission.create({
            project: project._id,
            user: userId,
            permissions: permissions as string[],
            createdBy: user._id
          });
        });
        await Promise.all(permissionPromises);
      } catch (permError) {
        logger.error('Error creating project permissions', { message: (permError as any)?.message });
        // Don't fail the project creation if permissions fail
      }
    }

    // Return immediately with essential data
    const response = {
      _id: project._id,
      name: project.name,
      description: project.description,
      projectType: project.projectType,
      status: project.status,
      priority: project.priority,
      startDate: project.startDate,
      endDate: project.endDate,
      budget: project.budget,
      currency: project.currency,
      progress: project.progress,
      progressMode: project.progressMode,
      jobNumber: project.jobNumber,
      projectCategory: project.projectCategory,
      client: project.client,
      clientContact: project.clientContact,
      siteLocation: project.siteLocation,
      tender: project.tender,
      baseline: project.baseline,
      actualStartDate: project.actualStartDate,
      actualEndDate: project.actualEndDate,
      manager: project.managers && project.managers.length > 0 ? project.managers[0] : null,
      team: project.team,
      owner: project.owner,
      members: project.team,
      departments: project.departments,
      tags: project.tags,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt
    };

    res.status(201).json({ success: true, data: response });

    // Handle background tasks asynchronously without blocking response
    setImmediate(async () => {
      try {
        // Import modules only when needed
        const [
          { createTimelineEvent },
          { logActivity },
          { RealTimeEmitter },
          { io }
        ] = await Promise.all([
          import('../utils/timelineHelper'),
          import('../utils/activityLogger'),
          import('../utils/realTimeEmitter'),
          import('../server')
        ]);

        // Execute background tasks in parallel
        const backgroundTasks = [];

        // Auto-start workflow for the project (unless explicitly skipped)
        backgroundTasks.push(
          WorkflowProjectIntegration.onProjectCreated(
            project._id.toString(),
            user._id.toString(),
            {
              skipWorkflow: req.body.skipWorkflow === true,
              workflowTemplateId: req.body.workflowTemplateId,
              departmentId: project.departments?.[0]?.toString(),
              metadata: req.body.workflowMetadata
            }
          ).then(result => {
            if (result.workflowInstance) {
              io.emit('workflow:started', {
                projectId: project._id,
                workflowInstanceId: result.workflowInstance._id,
                workflowName: result.workflowInstance.templateName
              });
            }
          }).catch((err: any) => logger.error('Background task error', { message: err?.message }))
        );

        // Timeline event
        if (project.managers && project.managers.length > 0) {
          backgroundTasks.push(
            createTimelineEvent(
              'project',
              project._id.toString(),
              'created',
              'Project Created',
              `Project "${project.name}" was created`,
              project.managers[0].toString()
            ).catch((err: any) => logger.error('Background task error', { message: err?.message }))
          );
        }

        // Activity logging
        backgroundTasks.push(
          logActivity({
            userId: user._id.toString(),
            userName: user.name,
            action: 'create',
            resource: `Project: ${project.name}`,
            resourceType: 'project',
            resourceId: project._id.toString(),
            projectId: project._id.toString(),
            details: `Created new project "${project.name}"`,
            metadata: { 
              projectId: project._id, 
              projectName: project.name, 
              status: project.status 
            },
            category: 'project',
            severity: 'medium',
            ipAddress: req.ip || 'unknown'
          }).catch((err: any) => logger.error('Background task error', { message: err?.message }))
        );

        // Socket emissions
        backgroundTasks.push(
          Promise.resolve().then(() => {
            io.emit('project:created', response);
            return Promise.all([
              RealTimeEmitter.emitDashboardStats(),
              RealTimeEmitter.emitActivityLog({
                type: 'project',
                message: `New project "${project.name}" created`,
                user: user.name || 'System',
                userId: user._id?.toString(),
                metadata: { projectId: project._id, projectName: project.name }
              })
            ]);
          }).catch((err: any) => logger.error('Background task error', { message: err?.message }))
        );

        // Execute all background tasks
        await Promise.allSettled(backgroundTasks);
      } catch (error) {
        logger.error('Background task error', { message: error?.message });
      }
    });

  } catch (error) {
    logger.error('Error creating project', { message: error?.message });
    res.status(400).json({ 
      success: false, 
      message: 'Error creating project', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
};

export const updateProject = async (req: Request, res: Response) => {
  try {
    const oldProject = await Project.findById(req.params.id);
    if (!oldProject) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Access check: Root, projects.edit_all, or project owner/manager only
    const updateUser = req.user;
    if (updateUser) {
      const updateRoleName = typeof updateUser.role === 'object' && 'name' in updateUser.role ? updateUser.role.name : null;
      const updateRolePerms = (typeof updateUser.role === 'object' && 'permissions' in updateUser.role ? updateUser.role.permissions : []) as string[];
      const isRoot = updateRoleName === 'Root';
      const hasEditAll = updateRolePerms.includes('projects.edit_all');
      const isOwner = oldProject.owner?.toString() === updateUser._id.toString();
      const isManager = !!(oldProject.managers && oldProject.managers.some((m: any) => m.toString() === updateUser._id.toString()));
      if (!isRoot && !hasEditAll && !isOwner && !isManager) {
        return res.status(403).json({ success: false, message: 'Access denied: You do not have permission to edit this project' });
      }
    }
    
    // Validate and sanitize update data
    const updateData: any = {};
    
    // Only include fields that are actually being updated
    if (req.body.name !== undefined) updateData.name = req.body.name;
    if (req.body.description !== undefined) updateData.description = req.body.description;
    if (req.body.projectType !== undefined) updateData.projectType = req.body.projectType;
    if (req.body.status !== undefined) {
      if (!isValidProjectStatusTransition(oldProject.status, req.body.status)) {
        return res.status(400).json({
          success: false,
          message: `Cannot move a project from "${oldProject.status}" to "${req.body.status}"`,
          allowed: allowedProjectStatusTransitions(oldProject.status)
        });
      }
      updateData.status = req.body.status;
    }
    if (req.body.priority !== undefined) updateData.priority = req.body.priority;
    if (req.body.budget !== undefined) updateData.budget = parseFloat(req.body.budget) || 0;
    if (req.body.progress !== undefined) updateData.progress = Math.min(Math.max(parseInt(req.body.progress) || 0, 0), 100);
    if (req.body.client !== undefined) updateData.client = req.body.client;
    if (req.body.clientContact !== undefined) {
      updateData.clientContact = req.body.clientContact
        ? toObjectIdOrUndefined(req.body.clientContact)
        : null;
      if (req.body.clientContact && !updateData.clientContact) {
        return res.status(400).json({ success: false, message: 'Invalid client contact id' });
      }
    }
    if (req.body.siteLocation !== undefined) {
      updateData.siteLocation = parseSiteLocation(req.body.siteLocation) || null;
    }
    if (req.body.projectCategory !== undefined) {
      const category = parseProjectCategory(req.body.projectCategory);
      if (!category) {
        return res.status(400).json({
          success: false,
          message: `Invalid project category. Allowed: ${PROJECT_CATEGORIES.join(', ')}`
        });
      }
      updateData.projectCategory = category;
    }
    if (req.body.tender !== undefined) {
      updateData.tender = req.body.tender ? toObjectIdOrUndefined(req.body.tender) : null;
      if (req.body.tender && !updateData.tender) {
        return res.status(400).json({ success: false, message: 'Invalid tender id' });
      }
    }
    if (req.body.jobNumber !== undefined) {
      const jobNumber = String(req.body.jobNumber || '').trim();
      if (!jobNumber) {
        return res.status(400).json({ success: false, message: 'Job number cannot be cleared' });
      }
      const duplicate = await Project.findOne({
        jobNumber: jobNumber.toUpperCase(),
        _id: { $ne: req.params.id }
      })
        .select('_id')
        .setOptions({ includeDeleted: true });
      if (duplicate) {
        return res.status(409).json({
          success: false,
          message: `Job number ${jobNumber} is already in use`
        });
      }
      updateData.jobNumber = jobNumber;
    }
    if (req.body.manager !== undefined) updateData.manager = req.body.manager;
    if (req.body.managers !== undefined) updateData.managers = Array.isArray(req.body.managers) ? req.body.managers : [];
    if (req.body.team !== undefined) updateData.team = Array.isArray(req.body.team) ? req.body.team : [];
    if (req.body.departments !== undefined) updateData.departments = Array.isArray(req.body.departments) ? req.body.departments : [];
    if (req.body.tags !== undefined) updateData.tags = Array.isArray(req.body.tags) ? req.body.tags : [];

    if (req.body.dependencies !== undefined) {
      const dependencies = Array.isArray(req.body.dependencies) ? req.body.dependencies : [];

      if (dependencies.some((d: any) => d?.toString() === req.params.id)) {
        return res.status(400).json({ success: false, message: 'A project cannot depend on itself' });
      }

      const cycleAt = await findProjectDependencyCycle(req.params.id, dependencies);
      if (cycleAt) {
        return res.status(400).json({
          success: false,
          message: 'These dependencies would create a circular dependency',
          conflictingProject: cycleAt
        });
      }

      updateData.dependencies = dependencies;
    }
    
    // When switching to reporting type, set progressMode to financial
    if (req.body.projectType === 'reporting') {
      updateData.progressMode = 'financial';
    } else if (req.body.projectType === 'instruction') {
      updateData.progressMode = 'task-based';
    }
    
    // Handle dates carefully
    if (req.body.startDate) {
      try {
        updateData.startDate = new Date(req.body.startDate);
        if (isNaN(updateData.startDate.getTime())) {
          return res.status(400).json({ success: false, message: 'Invalid start date format' });
        }
      } catch (error) {
        return res.status(400).json({ success: false, message: 'Invalid start date format' });
      }
    }
    
    if (req.body.endDate) {
      try {
        updateData.endDate = new Date(req.body.endDate);
        if (isNaN(updateData.endDate.getTime())) {
          return res.status(400).json({ success: false, message: 'Invalid end date format' });
        }
      } catch (error) {
        return res.status(400).json({ success: false, message: 'Invalid end date format' });
      }
    }
    
    // Validate date range if both dates are provided
    if (updateData.startDate && updateData.endDate && updateData.startDate > updateData.endDate) {
      return res.status(400).json({ success: false, message: 'Start date must be before end date' });
    }

    // Actual dates are the as-built schedule; clearing them is allowed because
    // a wrongly recorded start has to be undoable.
    for (const field of ['actualStartDate', 'actualEndDate'] as const) {
      if (req.body[field] === undefined) continue;
      if (!req.body[field]) {
        updateData[field] = null;
        continue;
      }
      const parsed = parseOptionalDate(req.body[field]);
      if (!parsed) {
        return res.status(400).json({ success: false, message: `Invalid ${field} format` });
      }
      updateData[field] = parsed;
    }

    const resolvedActualStart = updateData.actualStartDate ?? oldProject.actualStartDate;
    const resolvedActualEnd = updateData.actualEndDate ?? oldProject.actualEndDate;
    if (resolvedActualStart && resolvedActualEnd && resolvedActualStart > resolvedActualEnd) {
      return res.status(400).json({
        success: false,
        message: 'Actual start date must be before actual end date'
      });
    }

    // The baseline is only writable while the project has not been baselined
    // against a tender, so an awarded position cannot be edited away.
    if (req.body.baseline !== undefined && oldProject.baseline?.source !== 'tender') {
      const baseline = req.body.baseline || {};
      updateData.baseline = {
        startDate: parseOptionalDate(baseline.startDate) || oldProject.baseline?.startDate,
        endDate: parseOptionalDate(baseline.endDate) || oldProject.baseline?.endDate,
        contractValue: Number.isFinite(Number(baseline.contractValue))
          ? Number(baseline.contractValue)
          : oldProject.baseline?.contractValue,
        manHours: Number.isFinite(Number(baseline.manHours))
          ? Number(baseline.manHours)
          : oldProject.baseline?.manHours,
        source: 'manual',
        capturedAt: oldProject.baseline?.capturedAt || new Date()
      };
    }
    
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('managers', 'name email')
     .populate('team', 'name email')
     .populate('owner', 'name email')
     .populate('departments', 'name description')
     .populate('clientContact', 'name company email phone address');
    
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found after update' });
    }
    
    // Timeline actor is always the authenticated user; never client-supplied.
    const managerId = req.user?._id?.toString() || null;

    if (!managerId) {
      logger.warn('No authenticated user found for timeline event');
    } else {
      // Create timeline event
      try {
        if (oldProject.status !== project.status) {
          await createTimelineEvent(
            'project',
            project._id.toString(),
            'status_changed',
            'Status Updated',
            `Project status changed from "${oldProject.status}" to "${project.status}"`,
            managerId,
            {
              field: 'status',
              oldValue: oldProject.status,
              newValue: project.status
            }
          );
        } else {
          await createTimelineEvent(
            'project',
            project._id.toString(),
            'updated',
            'Project Updated',
            `Project "${project.name}" was updated`,
            managerId
          );
        }
      } catch (timelineError) {
        logger.error('Timeline event creation failed', { message: (timelineError as any)?.message });
      }
    }
    
    await invalidateProjectListCache();

    // Emit socket events (non-blocking)
    setImmediate(async () => {
      try {
        const { io } = await import('../server');
        io.emit('project:updated', project);
        await emitProjectStats();
        
        // Send notification
        const { NotificationEmitter } = await import('../utils/notificationEmitter');
        NotificationEmitter.projectUpdated(project);
        
        // Log project update activity
        const { logActivity } = await import('../utils/activityLogger');
        await logActivity({
          userId: req.user?._id?.toString() || 'system',
          userName: req.user?.name || 'System',
          action: 'update',
          resource: `Project: ${project.name}`,
          resourceType: 'project',
          resourceId: project._id.toString(),
          projectId: project._id.toString(),
          details: oldProject.status !== project.status ? 
            `Updated project "${project.name}" - Status changed from ${oldProject.status} to ${project.status}` :
            `Updated project "${project.name}"`,
          metadata: { 
            projectId: project._id, 
            projectName: project.name, 
            oldStatus: oldProject.status,
            newStatus: project.status,
            changes: Object.keys(updateData)
          },
          category: 'project',
          severity: oldProject.status !== project.status ? 'medium' : 'low',
          ipAddress: req.ip || req.socket.remoteAddress || 'unknown'
        });

        // Emit dashboard stats update
        const { RealTimeEmitter } = await import('../utils/realTimeEmitter');
        await RealTimeEmitter.emitDashboardStats();
        await RealTimeEmitter.emitActivityLog({
          type: 'project',
          message: `Project "${project.name}" updated`,
          user: req.user?.name || 'System',
          userId: req.user?._id?.toString(),
          metadata: { projectId: project._id, projectName: project.name, status: project.status }
        });
      } catch (error) {
        logger.error('Background task error', { message: error?.message });
      }
    });
    
    res.json({ success: true, data: project });
  } catch (error) {
    logger.error('Error updating project', { message: error?.message });
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('validation')) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          error: error.message,
          details: 'Please check your input data format'
        });
      }
      if (error.message.includes('Cast to ObjectId')) {
        return res.status(400).json({
          success: false,
          message: 'Invalid ID format',
          error: 'One or more IDs are not in valid format'
        });
      }
    }

    res.status(400).json({
      success: false,
      message: 'Error updating project',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const updateProjectStatus = async (req: Request, res: Response) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required' });
    }

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const oldStatus = project.status;

    if (!isValidProjectStatusTransition(oldStatus, status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot move a project from "${oldStatus}" to "${status}"`,
        allowed: allowedProjectStatusTransitions(oldStatus)
      });
    }

    project.status = status;
    await project.save();
    await project.populate('managers', 'name email');
    await project.populate('team', 'name email');
    await project.populate('owner', 'name email');
    await project.populate('departments', 'name description');
    
    // Timeline actor is always the authenticated user; never client-supplied.
    const userId = req.user?._id?.toString();

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    await createTimelineEvent(
      'project',
      project._id.toString(),
      'status_changed',
      'Status Updated',
      `Project status changed from "${oldStatus}" to "${status}"`,
      userId,
      { field: 'status', oldValue: oldStatus, newValue: status }
    );
    
    await invalidateProjectListCache();

    const { io } = await import('../server');
    io.emit('project:status:updated', project);
    await emitProjectStats();
    
    // Emit dashboard stats update
    const { RealTimeEmitter } = await import('../utils/realTimeEmitter');
    await RealTimeEmitter.emitDashboardStats();

    // Sync workflow state with project status change
    WorkflowProjectIntegration.onProjectStatusChanged(
      project._id.toString(),
      oldStatus,
      status,
      userId
    ).catch((err: any) => logger.error('Error syncing workflow on status change', { message: err?.message }));
    
    res.json({ success: true, data: project });
  } catch (error) {
    logger.error('Error updating project status', { message: error?.message });
    res.status(400).json({ success: false, message: 'Error updating project status', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const deleteProject = async (req: Request, res: Response) => {
  try {
    // Access check: Root, projects.edit_all, or project owner/manager only
    const deleteUser = req.user;
    if (deleteUser) {
      const deleteRoleName = typeof deleteUser.role === 'object' && 'name' in deleteUser.role ? deleteUser.role.name : null;
      const deleteRolePerms = (typeof deleteUser.role === 'object' && 'permissions' in deleteUser.role ? deleteUser.role.permissions : []) as string[];
      const isRoot = deleteRoleName === 'Root';
      const hasEditAll = deleteRolePerms.includes('projects.edit_all');
      if (!isRoot && !hasEditAll) {
        const projectToCheck = await Project.findById(req.params.id);
        if (!projectToCheck) {
          return res.status(404).json({ success: false, message: 'Project not found' });
        }
        const isOwner = projectToCheck.owner?.toString() === deleteUser._id.toString();
        const isManager = !!(projectToCheck.managers && projectToCheck.managers.some((m: any) => m.toString() === deleteUser._id.toString()));
        if (!isOwner && !isManager) {
          return res.status(403).json({ success: false, message: 'Access denied: You do not have permission to delete this project' });
        }
      }
    }

    // Soft delete. A project is referenced by ~28 collections including
    // FinancialEntry, ProjectLedger and Voucher; removing the document would
    // leave accounting records pointing at a dead id. Tasks are retained too.
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id },
      { $set: { deletedAt: new Date(), deletedBy: req.user?._id ?? null } },
      { new: true }
    );
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const actorId = req.user?._id?.toString() || null;

    if (actorId) {
      // Create timeline event
      await createTimelineEvent(
        'project',
        req.params.id,
        'deleted',
        'Project Deleted',
        `Project "${project.name}" was deleted`,
        actorId
      );
    }
    
    await invalidateProjectListCache();

    // Emit socket events
    const { io } = await import('../server');
    io.emit('project:deleted', { id: req.params.id });
    await emitProjectStats();
    
    // Log project deletion activity
    const { logActivity } = await import('../utils/activityLogger');
    await logActivity({
      userId: req.user?._id?.toString() || 'system',
      userName: req.user?.name || 'System',
      action: 'delete',
      resource: `Project: ${project.name}`,
      resourceType: 'project',
      resourceId: req.params.id,
      details: `Deleted project "${project.name}" (soft delete; tasks and financial records retained)`,
      metadata: { 
        projectId: project._id, 
        projectName: project.name,
        deletedAt: new Date().toISOString()
      },
      category: 'project',
      severity: 'high',
      ipAddress: req.ip || req.socket.remoteAddress || 'unknown'
    });

    // Emit dashboard stats update
    const { RealTimeEmitter } = await import('../utils/realTimeEmitter');
    await RealTimeEmitter.emitDashboardStats();
    await RealTimeEmitter.emitActivityLog({
      type: 'project',
      message: `Project "${project.name}" deleted`,
      user: req.user?.name || 'System',
      userId: req.user?._id?.toString(),
      metadata: { projectId: project._id, projectName: project.name }
    });
    
    res.json({ success: true, data: { message: 'Project deleted successfully' } });
  } catch (error) {
    logger.error('Error deleting project', { message: error?.message });
    res.status(500).json({ success: false, message: 'Error deleting project', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

// Restores a soft-deleted project. The explicit deletedAt predicate opts this
// query out of the schema's default exclusion, and makes restoring a project
// that was never deleted a 404 rather than a silent no-op.
export const restoreProject = async (req: Request, res: Response) => {
  try {
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, deletedAt: { $ne: null } },
      { $set: { deletedAt: null, deletedBy: null } },
      { new: true }
    );

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found or not deleted' });
    }

    const actorId = req.user?._id?.toString() || null;
    if (actorId) {
      await createTimelineEvent(
        'project',
        req.params.id,
        'updated',
        'Project Restored',
        `Project "${project.name}" was restored`,
        actorId
      );
    }

    await invalidateProjectListCache();

    const { io } = await import('../server');
    io.emit('project:restored', { id: req.params.id });
    await emitProjectStats();

    res.json({ success: true, data: project });
  } catch (error) {
    logger.error('Error restoring project', { message: error?.message });
    res.status(500).json({ success: false, message: 'Error restoring project', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const getProjectTasks = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    // Verify user has access to the project
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const roleName = typeof user.role === 'object' && 'name' in user.role ? user.role.name : null;
    const rolePermissions = (typeof user.role === 'object' && 'permissions' in user.role ? user.role.permissions : []) as string[];
    
    const isOwner = project.owner.toString() === user._id.toString();
    const userIdStr = user._id.toString();
    const isTeamMember = !!(project.team && project.team.some((t: any) => t.toString() === userIdStr));
    const isManager = !!(project.managers && project.managers.some((m: any) => m.toString() === userIdStr));

    if (roleName !== 'Root' && !rolePermissions.includes('projects.view_all') && !rolePermissions.includes('*') && !isOwner && !isTeamMember && !isManager) {
      return res.status(403).json({ message: 'Access denied: You are not assigned to this project' });
    }

    // ?critical=true narrows the list to the activities with no float, as
    // flagged by the last critical-path run.
    const taskFilter: any = { project: req.params.id };
    if (String(req.query.critical || '') === 'true') {
      taskFilter.isCritical = true;
    }

    const tasks = await Task.find(taskFilter)
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email');
    
    // Transform tasks to include projectId for frontend compatibility
    const transformedTasks = tasks.map(task => ({
      ...task.toObject(),
      projectId: task.project.toString()
    }));
    
    res.json(transformedTasks);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching project tasks', error });
  }
};

export const createProjectTask = async (req: Request, res: Response) => {
  try {
    const projectId = req.params.id;
    
    // Validate that the project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    const taskData = { ...req.body, project: projectId };
    
    const task = new Task(taskData);
    await task.save();
    await task.populate('project', 'name');
    await task.populate('assignedTo', 'name email');
    await task.populate('assignedBy', 'name email');
    
    // Create timeline event for task creation
    const assignedById = task.assignedBy ? 
                        (task.assignedBy._id?.toString() || task.assignedBy.toString()) : 
                        req.body.assignedBy;
    
    if (assignedById) {
      try {
        await createTimelineEvent(
          'task',
          task._id.toString(),
          'created',
          'Task Created',
          `Task "${task.title}" was created in project "${project.name}"`,
          assignedById
        );
      } catch (timelineError) {
        logger.error('Timeline event creation failed', { message: (timelineError as any)?.message });
      }
    }
    
    // Transform task to include projectId for frontend compatibility
    const transformedTask = {
      ...task.toObject(),
      projectId: task.project.toString()
    };
    
    // Emit socket events
    const { io } = await import('../server');
    io.emit('task:created', transformedTask);
    await emitProjectStats();
    
    // Log task creation activity
    const { logActivity } = await import('../utils/activityLogger');
    await logActivity({
      userId: req.user?._id?.toString() || 'system',
      userName: req.user?.name || 'System',
      action: 'create',
      resource: `Task: ${task.title}`,
      resourceType: 'task',
      resourceId: task._id.toString(),
      projectId: project._id.toString(),
      details: `Created new task "${task.title}" in project "${project.name}"`,
      metadata: { 
        taskId: task._id, 
        taskTitle: task.title, 
        projectId: project._id, 
        projectName: project.name,
        priority: task.priority,
        dueDate: task.dueDate,
        assignedTo: task.assignedTo
      },
      category: 'project',
      severity: 'low',
      ipAddress: req.ip || req.socket.remoteAddress || 'unknown'
    });

    // Emit dashboard stats update
    const { RealTimeEmitter } = await import('../utils/realTimeEmitter');
    await RealTimeEmitter.emitDashboardStats();
    await RealTimeEmitter.emitActivityLog({
      type: 'task',
      message: `New task "${task.title}" created in project "${project.name}"`,
      user: req.user?.name || 'System',
      userId: req.user?._id?.toString(),
      metadata: { taskId: task._id, taskTitle: task.title, projectId: project._id, projectName: project.name }
    });
    
    res.status(201).json(transformedTask);
  } catch (error) {
    logger.error('Error creating project task', { message: error?.message });
    res.status(400).json({ message: 'Error creating project task', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const getProjectStats = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    let query: any = {};
    const roleName = typeof user.role === 'object' && 'name' in user.role ? user.role.name : null;
    const rolePermissions = (typeof user.role === 'object' && 'permissions' in user.role ? user.role.permissions : []) as string[];
    
    // Root and users with projects.view_all can see all project stats
    if (roleName !== 'Root' && !rolePermissions.includes('projects.view_all') && !rolePermissions.includes('*')) {
      query = { $or: [
        { owner: user._id },
        { team: user._id },
        { managers: user._id }
      ] };
    }

    const totalProjects = await Project.countDocuments(query);
    const activeProjects = await Project.countDocuments({ ...query, status: 'active' });
    const completedProjects = await Project.countDocuments({ ...query, status: 'completed' });
    
    // Get project IDs for task stats
    const projects = await Project.find(query).select('_id');
    const projectIds = projects.map(p => p._id);
    
    const overdueTasks = await Task.countDocuments({ 
      project: { $in: projectIds },
      dueDate: { $lt: new Date() }, 
      status: { $ne: 'completed' } 
    });
    
    const stats = {
      totalProjects,
      activeProjects,
      completedProjects,
      overdueTasks,
      totalTasks: await Task.countDocuments({ project: { $in: projectIds } }),
      completedTasks: await Task.countDocuments({ project: { $in: projectIds }, status: 'completed' }),
      atRiskProjects: await Project.countDocuments({ ...query, 'risks.severity': { $in: ['high', 'critical'] } }),
      overdueProjects: await Project.countDocuments({ ...query, endDate: { $lt: new Date() }, status: { $ne: 'completed' } })
    };
    
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching project stats', error });
  }
};

export const cloneProject = async (req: Request, res: Response) => {
  try {
    const sourceProject = await Project.findById(req.params.id);
    if (!sourceProject) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    
    const clonedData = {
      ...sourceProject.toObject(),
      _id: undefined,
      name: `${sourceProject.name} (Copy)`,
      status: 'planning',
      progress: 0,
      spentBudget: 0,
      owner: user._id,
      createdAt: undefined,
      updatedAt: undefined
    };
    
    const clonedProject = new Project(clonedData);
    await clonedProject.save();
    await clonedProject.populate('managers', 'name email');
    await clonedProject.populate('team', 'name email');
    await clonedProject.populate('owner', 'name email');
    await clonedProject.populate('departments', 'name description');
    
    await invalidateProjectListCache();

    const { io } = await import('../server');
    io.emit('project:created', clonedProject);
    await emitProjectStats();
    
    // Emit dashboard stats update
    const { RealTimeEmitter } = await import('../utils/realTimeEmitter');
    await RealTimeEmitter.emitDashboardStats();
    
    res.status(201).json(clonedProject);
  } catch (error) {
    logger.error('Error cloning project', { message: error?.message });
    res.status(400).json({ message: 'Error cloning project', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const updateProjectRisks = async (req: Request, res: Response) => {
  try {
    const { risks } = req.body;
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { risks },
      { new: true, runValidators: true }
    );
    
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    await invalidateProjectListCache();

    const { io } = await import('../server');
    io.emit('project:risks:updated', { projectId: project._id, risks: project.risks });
    
    res.json({ success: true, data: project });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Error updating risks', error });
  }
};

export const calculateProjectProgress = async (req: Request, res: Response) => {
  try {
    const projectId = req.params.id;
    const project = await Project.findById(projectId);
    
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const { progress, totalTasks, completedTasks, weighted } = await computeProjectProgress(projectId);

    // Man-hours are recomputed alongside progress so the two never disagree.
    const manHours = await rollUpProjectManHours(projectId);

    if (totalTasks === 0) {
      return res.json({ success: true, data: { progress: 0, manHours, message: 'No tasks found' } });
    }

    project.progress = progress;
    await project.save();

    await invalidateProjectListCache();

    const { io } = await import('../server');
    io.emit('project:progress:updated', { projectId, progress });

    res.json({ success: true, data: { progress, totalTasks, completedTasks, weighted, manHours } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error calculating progress', error });
  }
};

/**
 * Recompute the planned vs actual man-hour rollup for a project and return it
 * alongside the baseline figure, so tender hours and worked hours sit together.
 */
export const recalculateProjectManHours = async (req: Request, res: Response) => {
  try {
    const projectId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ success: false, message: 'Invalid project id' });
    }

    const project = await Project.findById(projectId).select('baseline manHours');
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const manHours = await rollUpProjectManHours(projectId);

    res.json({
      success: true,
      data: {
        ...manHours,
        baselineManHours: project.baseline?.manHours ?? null,
        lastCalculatedAt: new Date()
      }
    });
  } catch (error) {
    logger.error('Error recalculating project man-hours', { message: (error as any)?.message });
    res.status(500).json({ success: false, message: 'Error recalculating man-hours' });
  }
};

export const getProjectTimelineData = async (req: Request, res: Response) => {
  try {
    const projectId = req.params.id;
    const project = await Project.findById(projectId);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    const tasks = await Task.find({ project: projectId })
      .populate('assignedTo', 'name email')
      .select('title status priority dueDate createdAt');
    
    const timelineData = {
      project: {
        id: project._id,
        name: project.name,
        startDate: project.startDate,
        endDate: project.endDate,
        status: project.status
      },
      tasks: tasks.map(task => ({
        id: task._id,
        name: task.title,
        startDate: task.createdAt,
        endDate: task.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        progress: task.status === 'completed' ? 100 : task.status === 'in-progress' ? 50 : 0,
        status: task.status,
        priority: task.priority,
        assignees: task.assignedTo
      }))
    };
    
    res.json(timelineData);
  } catch (error) {
    logger.error('Error fetching project timeline data', { message: error?.message });
    res.status(500).json({ message: 'Error fetching project timeline data', error });
  }
};

export const getAllProjectsTimelineData = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    let query: any = {};
    
    // Get role name (handle both populated and unpopulated role)
    const roleName = typeof user.role === 'object' && 'name' in user.role ? user.role.name : null;
    const rolePermissions = (typeof user.role === 'object' && 'permissions' in user.role ? user.role.permissions : []) as string[];
    
    if (roleName === 'Root' || rolePermissions.includes('projects.view_all') || rolePermissions.includes('*')) {
      query = {};
    } else {
      query = { $or: [
        { owner: user._id },
        { team: user._id },
        { managers: user._id }
      ] };
    }

    const projects = await Project.find(query).select('name startDate endDate status');
    const projectIds = projects.map(p => p._id);
    
    // Only fetch tasks from projects the user has access to
    const allTasks = await Task.find({ project: { $in: projectIds } })
      .populate('assignedTo', 'name email')
      .select('title status priority dueDate createdAt project');
    
    const timelineData = {
      projects: projects.map(p => ({
        id: p._id,
        name: p.name,
        startDate: p.startDate,
        endDate: p.endDate,
        status: p.status
      })),
      tasks: allTasks.map(task => ({
        id: task._id,
        name: task.title,
        startDate: task.createdAt,
        endDate: task.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        progress: task.status === 'completed' ? 100 : task.status === 'in-progress' ? 50 : 0,
        status: task.status,
        priority: task.priority,
        projectId: task.project
      }))
    };
    
    res.json(timelineData);
  } catch (error) {
    logger.error('Error fetching all projects timeline data', { message: error?.message });
    res.status(500).json({ message: 'Error fetching timeline data', error });
  }
};

export const updateProjectTask = async (req: Request, res: Response) => {
  try {
    const { id: projectId, taskId } = req.params;
    
    // Validate that the project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    const task = await Task.findOneAndUpdate(
      { _id: taskId, project: projectId },
      req.body,
      { new: true, runValidators: true }
    ).populate('assignedTo', 'name email')
     .populate('assignedBy', 'name email');
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Create timeline event
    const userId = req.body.updatedBy || task.assignedBy?.toString();
    if (userId) {
      await createTimelineEvent(
        'task',
        task._id.toString(),
        'updated',
        'Task Updated',
        `Task "${task.title}" was updated`,
        userId
      );
    }
    
    // Transform task to include projectId for frontend compatibility
    const transformedTask = {
      ...task.toObject(),
      projectId: task.project.toString()
    };
    
    // Emit socket events
    const { io } = await import('../server');
    io.emit('task:updated', transformedTask);
    await emitProjectStats();
    
    // Emit dashboard stats update
    const { RealTimeEmitter } = await import('../utils/realTimeEmitter');
    await RealTimeEmitter.emitDashboardStats();
    await RealTimeEmitter.emitActivityLog({
      type: 'task',
      message: `Task "${task.title}" updated`,
      user: req.user?.name || 'System',
      userId: req.user?._id?.toString(),
      metadata: { taskId: task._id, taskTitle: task.title, status: task.status }
    });
    
    res.json(transformedTask);
  } catch (error) {
    logger.error('Error updating project task', { message: error?.message });
    res.status(400).json({ message: 'Error updating project task', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const deleteProjectTask = async (req: Request, res: Response) => {
  try {
    const { id: projectId, taskId } = req.params;
    
    // Validate that the project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // First find the task to get its data before deletion
    const task = await Task.findOne({ _id: taskId, project: projectId });
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Now delete the task
    await Task.findOneAndDelete({ _id: taskId, project: projectId });
    
    // Create timeline event
    const userId = req.body.deletedBy || task.assignedBy?.toString();
    if (userId) {
      await createTimelineEvent(
        'task',
        taskId,
        'deleted',
        'Task Deleted',
        `Task "${task.title}" was deleted`,
        userId
      );
    }
    
    // Emit socket events
    const { io } = await import('../server');
    io.emit('task:deleted', { id: taskId });
    await emitProjectStats();
    
    // Emit dashboard stats update
    const { RealTimeEmitter } = await import('../utils/realTimeEmitter');
    await RealTimeEmitter.emitDashboardStats();
    await RealTimeEmitter.emitActivityLog({
      type: 'task',
      message: `Task "${task.title}" deleted`,
      user: req.user?.name || 'System',
      userId: req.user?._id?.toString(),
      metadata: { taskId: task._id, taskTitle: task.title }
    });
    
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    logger.error('Error deleting project task', { message: error?.message });
    res.status(500).json({ message: 'Error deleting project task', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const getProjectTimeline = async (req: Request, res: Response) => {
  try {
    // Validate that the project exists
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    const timeline = await getEntityTimeline('project', req.params.id);
    res.json(timeline);
  } catch (error) {
    logger.error('Error fetching project timeline', { message: error?.message });
    res.status(500).json({ message: 'Error fetching project timeline', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const addProjectMember = async (req: Request, res: Response) => {
  try {
    const { memberId } = req.body;
    const projectId = req.params.id;
    
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    if (project.team.includes(memberId)) {
      return res.status(400).json({ success: false, message: 'User is already a member' });
    }

    project.team.push(memberId);
    await project.save();
    await project.populate('team', 'name email');

    await invalidateProjectListCache();

    res.json({ success: true, message: 'Member added successfully', team: project.team });
  } catch (error) {
    logger.error('Error adding project member', { message: error?.message });
    res.status(500).json({ success: false, message: 'Error adding member', error });
  }
};

export const removeProjectMember = async (req: Request, res: Response) => {
  try {
    const { memberId } = req.params;
    const projectId = req.params.id;
    
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    project.team = project.team.filter(id => id.toString() !== memberId);
    await project.save();
    await project.populate('team', 'name email');

    await invalidateProjectListCache();

    res.json({ success: true, message: 'Member removed successfully', team: project.team });
  } catch (error) {
    logger.error('Error removing project member', { message: error?.message });
    res.status(500).json({ success: false, message: 'Error removing member', error });
  }
};

export const getProjectMembers = async (req: Request, res: Response) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('team', 'name email');
    
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    
    res.json({ 
      success: true, 
      owner: project.owner,
      team: project.team 
    });
  } catch (error) {
    logger.error('Error fetching project members', { message: error?.message });
    res.status(500).json({ success: false, message: 'Error fetching members', error });
  }
};

export const getProjectActivity = async (req: Request, res: Response) => {
  try {
    const projectId = req.params.id;
    const { resourceType, page = 1, limit = 50 } = req.query;
    
    // Validate that the project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Import ActivityLog
    const ActivityLog = (await import('../models/ActivityLog')).default;
    
    // Build query
    const query: any = { projectId };
    if (resourceType) query.resourceType = resourceType;
    
    const skip = (Number(page) - 1) * Number(limit);
    
    const activities = await ActivityLog.find(query)
      .populate('user', 'name email')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();
    
    const total = await ActivityLog.countDocuments(query);
    
    res.json({
      success: true,
      data: activities,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    logger.error('Error fetching project activity', { message: error?.message });
    res.status(500).json({ message: 'Error fetching project activity', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const addProjectInstruction = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, content, type, priority } = req.body;
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    const instruction = {
      title,
      content,
      type: type || 'general',
      priority: priority || 'medium',
      createdBy: user._id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    project.instructions.push(instruction);
    await project.save();
    
    const { io } = await import('../server');
    io.emit('project:instruction:added', { projectId: id, instruction });
    
    res.status(201).json({ success: true, instruction });
  } catch (error) {
    res.status(500).json({ message: 'Error adding instruction', error });
  }
};

export const updateProjectInstruction = async (req: Request, res: Response) => {
  try {
    const { id, instructionId } = req.params;
    const { title, content, type, priority } = req.body;
    
    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    const instruction = (project.instructions as any).id(instructionId);
    if (!instruction) {
      return res.status(404).json({ message: 'Instruction not found' });
    }
    
    instruction.title = title || instruction.title;
    instruction.content = content || instruction.content;
    instruction.type = type || instruction.type;
    instruction.priority = priority || instruction.priority;
    instruction.updatedAt = new Date();
    
    await project.save();
    
    const { io } = await import('../server');
    io.emit('project:instruction:updated', { projectId: id, instruction });
    
    res.json({ success: true, instruction });
  } catch (error) {
    res.status(500).json({ message: 'Error updating instruction', error });
  }
};

export const deleteProjectInstruction = async (req: Request, res: Response) => {
  try {
    const { id, instructionId } = req.params;
    
    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    (project.instructions as any).id(instructionId)?.remove();
    await project.save();
    
    const { io } = await import('../server');
    io.emit('project:instruction:deleted', { projectId: id, instructionId });
    
    res.json({ success: true, message: 'Instruction deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting instruction', error });
  }
};

export const reorderTasks = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { tasks } = req.body;
    
    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    const updatePromises = tasks.map((task: any) => 
      Task.findByIdAndUpdate(task.id, { 
        order: task.order, 
        column: task.column,
        status: task.status 
      })
    );
    
    await Promise.all(updatePromises);
    
    const { io } = await import('../server');
    io.emit('project:tasks:reordered', { projectId: id, tasks });
    
    res.json({ success: true, message: 'Tasks reordered successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error reordering tasks', error });
  }
};

export const getProjectsByView = async (req: Request, res: Response) => {
  try {
    const { view } = req.query;
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const query: any = {};

    // Same access set as the main list: membership plus ProjectPermission grants
    const access = await getAccessibleProjectIdsForUser(user);
    if (!access.all) {
      query._id = { $in: access.ids };
    }

    switch (view) {
      case 'active':
        query.status = 'active';
        break;
      case 'completed':
        query.status = 'completed';
        break;
      case 'overdue':
        query.endDate = { $lt: new Date() };
        query.status = { $ne: 'completed' };
        break;
      case 'high-priority':
        query.priority = { $in: ['high', 'critical'] };
        break;
    }
    
    const projects = await Project.find(query)
      .populate(PROJECT_LIST_POPULATE)
      .sort({ updatedAt: -1 })
      .lean();

    res.json(projects);
  } catch (error) {
    logger.error('Error fetching projects by view', { message: error?.message });
    res.status(500).json({ success: false, message: 'Error fetching projects by view' });
  }
};

// Shared by the project and task access-request endpoints. Validates the
// submitted reason/urgency, which arrive straight from a user-facing form.
export const parseAccessRequestBody = (
  body: any
): { reason: string; urgency: 'low' | 'medium' | 'high' | 'urgent' } | { error: string } => {
  const reason = typeof body?.reason === 'string' ? body.reason.trim() : '';
  if (!reason) return { error: 'A reason for the request is required' };
  if (reason.length > 1000) return { error: 'Reason must be 1000 characters or fewer' };

  // The form offers "critical"; notifications call that priority "urgent".
  const urgencyMap: Record<string, 'low' | 'medium' | 'high' | 'urgent'> = {
    low: 'low',
    medium: 'medium',
    high: 'high',
    critical: 'urgent'
  };
  const urgency = urgencyMap[String(body?.urgency ?? 'medium')];
  if (!urgency) return { error: 'Urgency must be one of: low, medium, high, critical' };

  return { reason, urgency };
};

// Lets a user who can only see a project through a department grant ask its
// owner and managers to assign them. It grants nothing on its own.
export const requestProjectAccess = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const parsed = parseAccessRequestBody(req.body);
    if ('error' in parsed) {
      return res.status(400).json({ success: false, message: parsed.error });
    }

    const project = await Project.findById(req.params.id).select('name owner managers').lean();
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Nothing to request if they can already reach it in full.
    const denial = await resolveProjectAccess(user, req.params.id);
    if (!denial) {
      return res.status(400).json({ success: false, message: 'You already have access to this project' });
    }

    const notified = await NotificationEmitter.projectAccessRequested({
      project: project as any,
      requesterId: user._id.toString(),
      requesterName: user.name || user.email,
      itemType: 'project',
      itemName: project.name,
      reason: parsed.reason,
      urgency: parsed.urgency
    });

    if (!notified) {
      return res.status(409).json({
        success: false,
        message: 'This project has no owner or manager who can grant access'
      });
    }

    logger.info('Project access requested', {
      projectId: req.params.id,
      requestedBy: user._id.toString(),
      notified
    });

    return res.json({
      success: true,
      message: `Request sent to ${notified} ${notified === 1 ? 'person' : 'people'} who can grant access`
    });
  } catch (error) {
    logger.error('Error requesting project access', { message: error?.message });
    res.status(500).json({ success: false, message: 'Error sending access request' });
  }
};

export const getProjectTemplates = async (req: Request, res: Response) => {
  try {
    const templates = [
      { id: 'software', name: 'Software Development', description: 'Standard software project template' },
      { id: 'marketing', name: 'Marketing Campaign', description: 'Marketing project template' },
      { id: 'construction', name: 'Construction Project', description: 'Construction management template' },
      { id: 'research', name: 'Research & Development', description: 'R&D project template' },
      { id: 'event', name: 'Event Planning', description: 'Event management template' }
    ];
    res.json({ success: true, data: templates });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching templates', error });
  }
};

// Fast project creation endpoint - minimal processing
export const createProjectFast = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    // Validate required fields only
    const { name, description, startDate, endDate } = req.body;
    if (!name?.trim() || !description?.trim() || !startDate || !endDate) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name, description, start date, and end date are required' 
      });
    }

    // Create project with minimal data processing
    const projectData = {
      name: name.trim(),
      description: description.trim(),
      projectType: req.body.projectType || 'instruction',
      status: req.body.status || 'planning',
      priority: req.body.priority || 'medium',
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      budget: parseFloat(req.body.budget) || 0,
      currency: req.body.currency || 'USD',
      progress: Math.min(Math.max(parseInt(req.body.progress) || 0, 0), 100),
      progressMode: req.body.projectType === 'reporting' ? 'financial' : (req.body.progressMode || 'task-based'),
      client: req.body.client?.trim() || undefined,
      manager: req.body.managers && req.body.managers.length > 0 ? req.body.managers[0] : req.body.manager,
      managers: Array.isArray(req.body.managers) ? req.body.managers : (req.body.manager ? [req.body.manager] : []),
      team: Array.isArray(req.body.team) ? req.body.team : [],
      departments: Array.isArray(req.body.departments) ? req.body.departments : [],
      tags: Array.isArray(req.body.tags) ? req.body.tags : [],
      owner: user._id,
      risks: Array.isArray(req.body.risks) ? req.body.risks : [],
      dependencies: Array.isArray(req.body.dependencies) ? req.body.dependencies : [],
      instructions: Array.isArray(req.body.instructions) ? req.body.instructions : [],
      projectCategory: parseProjectCategory(req.body.projectCategory) || 'other',
      clientContact: toObjectIdOrUndefined(req.body.clientContact),
      siteLocation: parseSiteLocation(req.body.siteLocation),
      tender: toObjectIdOrUndefined(req.body.tender),
      actualStartDate: parseOptionalDate(req.body.actualStartDate),
      actualEndDate: parseOptionalDate(req.body.actualEndDate)
    };

    // A supplied job number wins so an existing register can be carried over;
    // otherwise the next number in the sequence is allocated.
    const suppliedJobNumber = typeof req.body.jobNumber === 'string' ? req.body.jobNumber.trim() : '';
    if (suppliedJobNumber) {
      const duplicate = await Project.findOne({ jobNumber: suppliedJobNumber.toUpperCase() })
        .select('_id')
        .setOptions({ includeDeleted: true });
      if (duplicate) {
        return res.status(409).json({
          success: false,
          message: `Job number ${suppliedJobNumber} is already in use`
        });
      }
      (projectData as any).jobNumber = suppliedJobNumber;
    } else {
      (projectData as any).jobNumber = await generateProjectJobNumber();
    }

    // The plan the project starts on is its baseline, so later revisions to
    // startDate/endDate/budget stay measurable against something.
    (projectData as any).baseline = {
      startDate: projectData.startDate,
      endDate: projectData.endDate,
      contractValue: projectData.budget,
      manHours: Number(req.body.baselineManHours) > 0 ? Number(req.body.baselineManHours) : undefined,
      source: 'manual',
      capturedAt: new Date()
    };

    // Create and save project
    const project = new Project(projectData);
    await project.save();

    await invalidateProjectListCache();

    // Return immediately with essential data
    const response = {
      _id: project._id,
      name: project.name,
      description: project.description,
      projectType: project.projectType,
      status: project.status,
      priority: project.priority,
      startDate: project.startDate,
      endDate: project.endDate,
      budget: project.budget,
      currency: project.currency,
      progress: project.progress,
      progressMode: project.progressMode,
      jobNumber: project.jobNumber,
      projectCategory: project.projectCategory,
      client: project.client,
      clientContact: project.clientContact,
      siteLocation: project.siteLocation,
      tender: project.tender,
      baseline: project.baseline,
      actualStartDate: project.actualStartDate,
      actualEndDate: project.actualEndDate,
      manager: project.managers && project.managers.length > 0 ? project.managers[0] : null,
      team: project.team,
      owner: project.owner,
      members: project.team,
      departments: project.departments,
      tags: project.tags,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt
    };

    res.status(201).json({ success: true, data: response });

    // Handle background tasks asynchronously without blocking response
    setImmediate(async () => {
      try {
        // Import modules only when needed
        const [
          { createTimelineEvent },
          { logActivity },
          { RealTimeEmitter },
          { io }
        ] = await Promise.all([
          import('../utils/timelineHelper'),
          import('../utils/activityLogger'),
          import('../utils/realTimeEmitter'),
          import('../server')
        ]);

        // Execute background tasks in parallel
        const backgroundTasks = [];

        // Timeline event
        if (project.managers && project.managers.length > 0) {
          backgroundTasks.push(
            createTimelineEvent(
              'project',
              project._id.toString(),
              'created',
              'Project Created',
              `Project "${project.name}" was created`,
              project.managers[0].toString()
            ).catch((err: any) => logger.error('Background task error', { message: err?.message }))
          );
        }

        // Activity logging
        backgroundTasks.push(
          logActivity({
            userId: user._id.toString(),
            userName: user.name,
            action: 'create',
            resource: `Project: ${project.name}`,
            resourceType: 'project',
            resourceId: project._id.toString(),
            projectId: project._id.toString(),
            details: `Created new project "${project.name}"`,
            metadata: { 
              projectId: project._id, 
              projectName: project.name, 
              status: project.status 
            },
            category: 'project',
            severity: 'medium',
            ipAddress: req.ip || 'unknown'
          }).catch((err: any) => logger.error('Background task error', { message: err?.message }))
        );

        // Socket emissions
        backgroundTasks.push(
          Promise.resolve().then(() => {
            io.emit('project:created', response);
            return Promise.all([
              RealTimeEmitter.emitDashboardStats(),
              RealTimeEmitter.emitActivityLog({
                type: 'project',
                message: `New project "${project.name}" created`,
                user: user.name || 'System',
                userId: user._id?.toString(),
                metadata: { projectId: project._id, projectName: project.name }
              })
            ]);
          }).catch((err: any) => logger.error('Background task error', { message: err?.message }))
        );

        // Execute all background tasks
        await Promise.allSettled(backgroundTasks);
      } catch (error) {
        logger.error('Background task error', { message: error?.message });
      }
    });

  } catch (error) {
    logger.error('Error creating project', { message: error?.message });
    res.status(400).json({ 
      success: false, 
      message: 'Error creating project', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
};

// Fast data loading endpoints
// Assignable people for project team/manager and task assignee pickers. These
// fields ref User, so this must serve User ids - serving Employee ids here
// writes HR ids into operational refs and silently breaks project access.
export const getUsersMinimal = async (req: Request, res: Response) => {
  try {
    const User = (await import('../models/User')).default;

    const users = await User.find(
      { status: 'active' },
      'name email _id'
    ).sort({ name: 1 }).lean().limit(200);

    res.json({ success: true, data: users });
  } catch (error) {
    logger.error('Error fetching minimal users', { message: error?.message });
    res.status(500).json({ success: false, message: 'Error fetching users' });
  }
};

export const getDepartmentsMinimal = async (req: Request, res: Response) => {
  try {
    const Department = (await import('../models/Department')).default;
    
    // Only fetch essential fields
    const departments = await Department.find(
      { status: 'active' }, 
      'name _id'
    ).lean().limit(50);

    res.json({ success: true, data: departments });
  } catch (error) {
    logger.error('Error fetching departments', { message: error?.message });
    res.status(500).json({ success: false, message: 'Error fetching departments' });
  }
};

