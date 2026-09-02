import { Request, Response } from 'express';
import WorkflowTemplate from '../models/WorkflowTemplate';
import { PROJECT_CATEGORIES } from '../models/Project';
import WorkflowInstance from '../models/WorkflowInstance';
import WorkflowEngine from '../services/workflowEngine';
import { WorkflowProjectIntegration } from '../services/workflowProjectIntegration';
import { canManageWorkflows } from '../middleware/rbac.middleware';
import { getAccessibleProjectIdsForUser } from '../middleware/projectAccess.middleware';
import { logger } from '../utils/logger';
import mongoose from 'mongoose';

// ==========================================
// SHARED HELPERS
// ==========================================

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const isInvalidId = (id: any) => !id || !mongoose.isValidObjectId(String(id));

const MAX_PAGE_LIMIT = 50;

const parsePagination = (query: any) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(MAX_PAGE_LIMIT, Math.max(1, Number(query.limit) || 20));
  return { page, limit, skip: (page - 1) * limit };
};

const PRIORITY_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

const INSTANCE_SORT_FIELDS = new Set([
  'startedAt', 'updatedAt', 'createdAt', 'completedAt', 'dueDate',
  'entityTitle', 'templateName', 'status', 'priority', 'progress'
]);

/**
 * Restrict non-admin users to workflows they initiated, participate in,
 * are assigned to, or that belong to a project they can access.
 * Returns null when the user may see everything.
 */
const buildInstanceScopeFilter = async (user: any): Promise<any | null> => {
  if (canManageWorkflows(user)) return null;

  const userId = new mongoose.Types.ObjectId(user._id.toString());
  const or: any[] = [
    { initiatedBy: userId },
    { participants: userId },
    { currentAssignees: userId }
  ];

  const access = await getAccessibleProjectIdsForUser(user);
  if (access.all) return null;
  if (access.ids.length) or.push({ projectId: { $in: access.ids } });

  return { $or: or };
};

/**
 * Post-fetch access check for a single (possibly populated) instance.
 */
const canViewInstance = async (instance: any, user: any): Promise<boolean> => {
  if (canManageWorkflows(user)) return true;

  const uid = user._id.toString();
  const idOf = (v: any) => (v?._id ?? v)?.toString?.();

  if (idOf(instance.initiatedBy) === uid) return true;
  if (instance.participants?.some((p: any) => idOf(p) === uid)) return true;
  if (instance.currentAssignees?.some((a: any) => idOf(a) === uid)) return true;
  if (instance.steps?.some((s: any) => s.assignedTo?.some((a: any) => idOf(a) === uid))) return true;

  if (instance.projectId) {
    const access = await getAccessibleProjectIdsForUser(user);
    if (access.all) return true;
    const projectId = idOf(instance.projectId);
    if (access.ids.some(id => id.toString() === projectId)) return true;
  }

  return false;
};

const validateTemplateSteps = (steps: any[]): string | null => {
  if (!Array.isArray(steps) || steps.length === 0) {
    return 'At least one step is required';
  }
  const stepIds = steps.map((s: any) => s?.stepId);
  if (stepIds.some(id => !id || typeof id !== 'string')) {
    return 'Every step needs a stepId';
  }
  if (new Set(stepIds).size !== stepIds.length) {
    return 'Step IDs must be unique';
  }
  if (steps.some((s: any) => !s?.name || typeof s.name !== 'string')) {
    return 'Every step needs a name';
  }
  const idSet = new Set(stepIds);
  for (const step of steps) {
    for (const next of step.nextSteps || []) {
      if (!idSet.has(next)) return `Step "${step.stepId}" references unknown next step "${next}"`;
    }
    if (step.trueBranch && !idSet.has(step.trueBranch)) {
      return `Step "${step.stepId}" references unknown true branch "${step.trueBranch}"`;
    }
    if (step.falseBranch && !idSet.has(step.falseBranch)) {
      return `Step "${step.stepId}" references unknown false branch "${step.falseBranch}"`;
    }
  }
  return null;
};

/** Only one default template per entity type */
const enforceSingleDefault = async (templateId: mongoose.Types.ObjectId, entityType: string) => {
  await WorkflowTemplate.updateMany(
    { _id: { $ne: templateId }, entityType, isDefault: true },
    { $set: { isDefault: false } }
  );
};

// ==========================================
// WORKFLOW TEMPLATE CONTROLLERS
// ==========================================

/**
 * Create a new workflow template
 */
export const createTemplate = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const {
      name, description, category, entityType, trigger, steps,
      departments, tags, priority, estimatedDurationHours, isDefault
    } = req.body;

    const stepError = validateTemplateSteps(steps);
    if (stepError) {
      return res.status(400).json({ success: false, message: stepError });
    }

    const template = new WorkflowTemplate({
      name,
      description,
      category,
      entityType,
      trigger,
      steps,
      departments,
      tags,
      priority,
      estimatedDurationHours,
      isDefault: !!isDefault,
      createdBy: req.user.id
    });

    await template.save();
    if (template.isDefault) {
      await enforceSingleDefault(template._id, template.entityType);
    }

    res.status(201).json({ success: true, data: template });
  } catch (error: any) {
    logger.error('Create workflow template error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * Get all workflow templates with filters
 */
export const getTemplates = async (req: Request, res: Response) => {
  try {
    const { category, entityType, isActive, search } = req.query;
    const { page, limit, skip } = parsePagination(req.query);

    const filter: any = {};
    if (category) filter.category = category;
    if (entityType) filter.entityType = entityType;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (search) filter.name = { $regex: escapeRegex(String(search)), $options: 'i' };

    const [templates, total] = await Promise.all([
      WorkflowTemplate.find(filter)
        .populate('createdBy', 'name email')
        .populate('departments', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      WorkflowTemplate.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: templates,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (error: any) {
    logger.error('Get workflow templates error:', error);
    res.status(500).json({ success: false, message: 'Failed to load workflow templates' });
  }
};

/**
 * Get a single workflow template by ID
 */
export const getTemplateById = async (req: Request, res: Response) => {
  try {
    if (isInvalidId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid template id' });
    }

    const template = await WorkflowTemplate.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('departments', 'name')
      .populate('steps.approverIds', 'name email');

    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }

    res.json({ success: true, data: template });
  } catch (error: any) {
    logger.error('Get workflow template error:', error);
    res.status(500).json({ success: false, message: 'Failed to load workflow template' });
  }
};

// Fields callers are allowed to change on a template; everything else
// (createdBy, version, timestamps) is server-managed
const TEMPLATE_UPDATABLE_FIELDS = [
  'name', 'description', 'category', 'entityType', 'trigger', 'steps',
  'departments', 'tags', 'priority', 'estimatedDurationHours', 'isActive', 'isDefault'
] as const;

/**
 * Update a workflow template
 */
export const updateTemplate = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    if (isInvalidId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid template id' });
    }

    const template = await WorkflowTemplate.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }

    const updates: any = {};
    for (const field of TEMPLATE_UPDATABLE_FIELDS) {
      if (field in req.body) updates[field] = req.body[field];
    }

    if ('steps' in updates) {
      const stepError = validateTemplateSteps(updates.steps);
      if (stepError) {
        return res.status(400).json({ success: false, message: stepError });
      }

      // Running instances keep executing against their recorded version;
      // bump the version so new instances are distinguishable
      const activeInstances = await WorkflowInstance.countDocuments({
        templateId: template._id,
        status: 'active'
      });
      if (activeInstances > 0) {
        updates.version = template.version + 1;
      }
    }

    updates.updatedBy = req.user.id;

    const updated = await WorkflowTemplate.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (updated?.isDefault) {
      await enforceSingleDefault(updated._id, updated.entityType);
    }

    res.json({ success: true, data: updated });
  } catch (error: any) {
    logger.error('Update workflow template error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * Delete a workflow template (soft delete - deactivate)
 */
export const deleteTemplate = async (req: Request, res: Response) => {
  try {
    if (isInvalidId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid template id' });
    }

    const template = await WorkflowTemplate.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }

    // Check for active instances
    const activeInstances = await WorkflowInstance.countDocuments({
      templateId: template._id,
      status: 'active'
    });

    if (activeInstances > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete template with ${activeInstances} active workflow instances`
      });
    }

    template.isActive = false;
    await template.save();

    res.json({ success: true, message: 'Template deactivated successfully' });
  } catch (error: any) {
    logger.error('Delete workflow template error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete workflow template' });
  }
};

/**
 * Clone a workflow template
 */
export const cloneTemplate = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    if (isInvalidId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid template id' });
    }

    const source = await WorkflowTemplate.findById(req.params.id);
    if (!source) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }

    const cloned = new WorkflowTemplate({
      ...source.toObject(),
      _id: undefined,
      name: `${source.name} (Copy)`,
      version: 1,
      isDefault: false,
      createdBy: req.user.id,
      createdAt: undefined,
      updatedAt: undefined
    });

    await cloned.save();
    res.status(201).json({ success: true, data: cloned });
  } catch (error: any) {
    logger.error('Clone workflow template error:', error);
    res.status(500).json({ success: false, message: 'Failed to clone workflow template' });
  }
};

// ==========================================
// WORKFLOW INSTANCE CONTROLLERS
// ==========================================

/**
 * Start a new workflow instance.
 * If entityType is 'project' and no entityId is provided, auto-creates the project.
 */
export const startWorkflow = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { templateId, entityType, entityId, entityTitle, projectId, departmentId, metadata, priority } = req.body;

    if (!templateId || !entityType) {
      return res.status(400).json({
        success: false,
        message: 'templateId and entityType are required'
      });
    }
    if (isInvalidId(templateId)) {
      return res.status(400).json({ success: false, message: 'Invalid templateId' });
    }

    // Reverse flow: If entityType is 'project' and no entityId, auto-create the project
    if (entityType === 'project' && !entityId) {
      const { projectName, projectDescription, startDate, endDate, budget, currency, managers, team, departments, client, clientContact, projectCategory, siteLocation, tags } = req.body;

      if (!projectName || typeof projectName !== 'string' || !projectName.trim()) {
        return res.status(400).json({
          success: false,
          message: 'projectName is required when creating a project from workflow'
        });
      }
      for (const [label, ids] of Object.entries({ managers, team, departments })) {
        if (ids !== undefined && (!Array.isArray(ids) || ids.some(isInvalidId))) {
          return res.status(400).json({ success: false, message: `${label} must be an array of valid ids` });
        }
      }
      if (clientContact !== undefined && clientContact && isInvalidId(clientContact)) {
        return res.status(400).json({ success: false, message: 'Invalid clientContact' });
      }
      if (projectCategory !== undefined && !PROJECT_CATEGORIES.includes(projectCategory)) {
        return res.status(400).json({
          success: false,
          message: `Invalid projectCategory. Allowed: ${PROJECT_CATEGORIES.join(', ')}`
        });
      }

      const result = await WorkflowProjectIntegration.onWorkflowInitiatedForProject(
        {
          templateId,
          projectName: projectName.trim(),
          projectDescription,
          startDate: startDate ? new Date(startDate) : undefined,
          endDate: endDate ? new Date(endDate) : undefined,
          budget,
          currency,
          priority,
          managers,
          team,
          departments,
          client,
          clientContact: clientContact || undefined,
          projectCategory,
          siteLocation,
          tags,
          metadata
        },
        req.user.id
      );

      return res.status(201).json({
        success: true,
        data: {
          workflowInstance: result.workflowInstance,
          project: result.project,
          autoCreated: true
        }
      });
    }

    // Standard flow: entityId must be provided
    if (!entityId || !entityTitle) {
      return res.status(400).json({
        success: false,
        message: 'entityId and entityTitle are required'
      });
    }
    if (isInvalidId(entityId)) {
      return res.status(400).json({ success: false, message: 'entityId must be a valid id' });
    }
    if ((projectId && isInvalidId(projectId)) || (departmentId && isInvalidId(departmentId))) {
      return res.status(400).json({ success: false, message: 'projectId and departmentId must be valid ids' });
    }

    const instance = await WorkflowEngine.startWorkflow({
      templateId,
      entityType,
      entityId,
      entityTitle,
      initiatedBy: req.user.id,
      projectId,
      departmentId,
      metadata,
      priority
    });

    res.status(201).json({ success: true, data: instance });
  } catch (error: any) {
    logger.error('Start workflow error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * Get workflow instances with filters, scoped to what the caller may see
 */
export const getInstances = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const {
      status, entityType, projectId, departmentId, priority,
      initiatedBy, assignedTo, slaBreached,
      search, sortBy = 'startedAt', sortOrder = 'desc'
    } = req.query;
    const { page, limit, skip } = parsePagination(req.query);

    for (const [label, value] of Object.entries({ projectId, departmentId, initiatedBy, assignedTo })) {
      if (value !== undefined && isInvalidId(value)) {
        return res.status(400).json({ success: false, message: `Invalid ${label}` });
      }
    }

    const filter: any = {};
    if (status) filter.status = status;
    if (entityType) filter.entityType = entityType;
    if (projectId) filter.projectId = projectId;
    if (departmentId) filter.departmentId = departmentId;
    if (priority) filter.priority = priority;
    if (initiatedBy) filter.initiatedBy = initiatedBy;
    if (assignedTo) filter.currentAssignees = assignedTo;
    if (slaBreached === 'true') filter.slaBreached = true;
    if (search) {
      const pattern = { $regex: escapeRegex(String(search)), $options: 'i' };
      filter.$or = [{ templateName: pattern }, { entityTitle: pattern }];
    }

    const scope = await buildInstanceScopeFilter(req.user);
    const query = scope ? { $and: [filter, scope] } : filter;

    const sortField = INSTANCE_SORT_FIELDS.has(String(sortBy)) ? String(sortBy) : 'startedAt';
    const sort: any = { [sortField]: sortOrder === 'asc' ? 1 : -1 };

    const [instances, total] = await Promise.all([
      WorkflowInstance.find(query)
        .populate('initiatedBy', 'name email')
        .populate('currentAssignees', 'name email')
        .populate('projectId', 'name')
        .populate('departmentId', 'name')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      WorkflowInstance.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: instances,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (error: any) {
    logger.error('Get workflow instances error:', error);
    res.status(500).json({ success: false, message: 'Failed to load workflow instances' });
  }
};

/**
 * Get a single workflow instance with full details
 */
export const getInstanceById = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    if (isInvalidId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid workflow instance id' });
    }

    const instance = await WorkflowInstance.findById(req.params.id)
      .populate('initiatedBy', 'name email avatar')
      .populate('currentAssignees', 'name email avatar')
      .populate('participants', 'name email avatar')
      .populate('projectId', 'name status')
      .populate('departmentId', 'name')
      .populate('templateId', 'name category steps')
      .populate('steps.assignedTo', 'name email')
      .populate('steps.approvals.userId', 'name email')
      .populate('comments.userId', 'name email avatar')
      .populate('auditTrail.performedBy', 'name email');

    if (!instance) {
      return res.status(404).json({ success: false, message: 'Workflow instance not found' });
    }

    if (!(await canViewInstance(instance, req.user))) {
      return res.status(403).json({ success: false, message: 'You do not have access to this workflow' });
    }

    res.json({ success: true, data: instance });
  } catch (error: any) {
    logger.error('Get workflow instance error:', error);
    res.status(500).json({ success: false, message: 'Failed to load workflow instance' });
  }
};

/**
 * Get my pending workflow actions (assigned to current user)
 */
export const getMyPendingActions = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const instances = await WorkflowInstance.find({
      status: 'active',
      currentAssignees: req.user.id
    })
      .populate('initiatedBy', 'name email')
      .populate('projectId', 'name')
      .sort({ startedAt: -1 })
      .limit(MAX_PAGE_LIMIT);

    // Priority is a string field; sort by real urgency, then recency
    instances.sort((a, b) => {
      const byPriority = (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9);
      if (byPriority !== 0) return byPriority;
      return new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime();
    });

    res.json({ success: true, data: instances });
  } catch (error: any) {
    logger.error('Get my pending actions error:', error);
    res.status(500).json({ success: false, message: 'Failed to load pending actions' });
  }
};

/**
 * Get workflows for a specific entity
 */
export const getEntityWorkflows = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { entityType, entityId } = req.params;
    if (isInvalidId(entityId)) {
      return res.status(400).json({ success: false, message: 'Invalid entity id' });
    }

    const scope = await buildInstanceScopeFilter(req.user);
    const filter: any = { entityType, entityId };
    const query = scope ? { $and: [filter, scope] } : filter;

    const instances = await WorkflowInstance.find(query)
      .populate('initiatedBy', 'name email')
      .populate('currentAssignees', 'name email')
      .sort({ startedAt: -1 })
      .limit(MAX_PAGE_LIMIT);

    res.json({ success: true, data: instances });
  } catch (error: any) {
    logger.error('Get entity workflows error:', error);
    res.status(500).json({ success: false, message: 'Failed to load entity workflows' });
  }
};

/**
 * Process a step action (approve, reject, complete, delegate, skip)
 */
export const processStepAction = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { id: instanceId, stepId } = req.params;
    if (isInvalidId(instanceId)) {
      return res.status(400).json({ success: false, message: 'Invalid workflow instance id' });
    }

    const { action, comments, delegateTo, resultData } = req.body;

    if (!['approve', 'reject', 'complete', 'delegate', 'skip'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Must be: approve, reject, complete, delegate, or skip'
      });
    }
    if (comments !== undefined && (typeof comments !== 'string' || comments.length > 2000)) {
      return res.status(400).json({ success: false, message: 'comments must be a string of at most 2000 characters' });
    }

    const instance = await WorkflowEngine.processStepAction({
      instanceId,
      stepId,
      action,
      userId: req.user.id,
      isPrivileged: canManageWorkflows(req.user),
      comments,
      delegateTo,
      resultData
    });

    res.json({ success: true, data: instance });
  } catch (error: any) {
    logger.error('Process step action error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * Add a comment to a workflow instance
 */
export const addComment = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    if (isInvalidId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid workflow instance id' });
    }

    const { comment, stepId, attachments } = req.body;
    if (!comment || typeof comment !== 'string' || !comment.trim()) {
      return res.status(400).json({ success: false, message: 'Comment is required' });
    }
    if (comment.length > 2000) {
      return res.status(400).json({ success: false, message: 'Comment must be at most 2000 characters' });
    }
    if (attachments !== undefined && (!Array.isArray(attachments) || attachments.some(a => typeof a !== 'string'))) {
      return res.status(400).json({ success: false, message: 'attachments must be an array of strings' });
    }

    const instance = await WorkflowInstance.findById(req.params.id);
    if (!instance) {
      return res.status(404).json({ success: false, message: 'Workflow instance not found' });
    }
    if (!(await canViewInstance(instance, req.user))) {
      return res.status(403).json({ success: false, message: 'You do not have access to this workflow' });
    }

    instance.comments.push({
      userId: req.user.id,
      stepId: typeof stepId === 'string' ? stepId : undefined,
      comment: comment.trim(),
      attachments,
      timestamp: new Date()
    });

    await instance.save();
    res.json({ success: true, data: instance });
  } catch (error: any) {
    logger.error('Add workflow comment error:', error);
    res.status(500).json({ success: false, message: 'Failed to add comment' });
  }
};

/** Only the initiator or a workflow administrator may change instance lifecycle */
const canControlInstance = (instance: any, user: any): boolean => {
  if (canManageWorkflows(user)) return true;
  const initiator = (instance.initiatedBy?._id ?? instance.initiatedBy)?.toString?.();
  return initiator === user._id.toString();
};

/**
 * Cancel a workflow instance
 */
export const cancelWorkflow = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    if (isInvalidId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid workflow instance id' });
    }

    const { reason } = req.body;
    if (!reason || typeof reason !== 'string' || !reason.trim()) {
      return res.status(400).json({ success: false, message: 'Cancellation reason is required' });
    }

    const existing = await WorkflowInstance.findById(req.params.id).select('initiatedBy');
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Workflow instance not found' });
    }
    if (!canControlInstance(existing, req.user)) {
      return res.status(403).json({ success: false, message: 'Only the initiator or an administrator can cancel this workflow' });
    }

    const instance = await WorkflowEngine.cancelWorkflow(req.params.id, req.user.id, reason.trim());
    res.json({ success: true, data: instance });
  } catch (error: any) {
    logger.error('Cancel workflow error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * Put workflow on hold
 */
export const holdWorkflow = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    if (isInvalidId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid workflow instance id' });
    }

    const existing = await WorkflowInstance.findById(req.params.id).select('initiatedBy');
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Workflow instance not found' });
    }
    if (!canControlInstance(existing, req.user)) {
      return res.status(403).json({ success: false, message: 'Only the initiator or an administrator can hold this workflow' });
    }

    const instance = await WorkflowEngine.holdWorkflow(req.params.id, req.user.id, req.body.reason);
    res.json({ success: true, data: instance });
  } catch (error: any) {
    logger.error('Hold workflow error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * Resume workflow from hold
 */
export const resumeWorkflow = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    if (isInvalidId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid workflow instance id' });
    }

    const existing = await WorkflowInstance.findById(req.params.id).select('initiatedBy');
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Workflow instance not found' });
    }
    if (!canControlInstance(existing, req.user)) {
      return res.status(403).json({ success: false, message: 'Only the initiator or an administrator can resume this workflow' });
    }

    const instance = await WorkflowEngine.resumeWorkflow(req.params.id, req.user.id);
    res.json({ success: true, data: instance });
  } catch (error: any) {
    logger.error('Resume workflow error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// ==========================================
// WORKFLOW ANALYTICS & DASHBOARD
// ==========================================

/**
 * Build the analytics match filter, scoped for non-admin users
 */
const buildAnalyticsMatchFilter = (req: Request): any | null => {
  const { projectId, departmentId, dateFrom, dateTo } = req.query;

  if (projectId !== undefined && isInvalidId(projectId)) return null;
  if (departmentId !== undefined && isInvalidId(departmentId)) return null;

  const matchFilter: any = {};
  if (projectId) matchFilter.projectId = new mongoose.Types.ObjectId(String(projectId));
  if (departmentId) matchFilter.departmentId = new mongoose.Types.ObjectId(String(departmentId));
  if (dateFrom || dateTo) {
    matchFilter.startedAt = {};
    if (dateFrom) matchFilter.startedAt.$gte = new Date(String(dateFrom));
    if (dateTo) matchFilter.startedAt.$lte = new Date(String(dateTo));
  }

  if (!canManageWorkflows(req.user)) {
    matchFilter.participants = new mongoose.Types.ObjectId(req.user!._id.toString());
  }

  return matchFilter;
};

/**
 * Get workflow dashboard stats
 */
export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const matchFilter = buildAnalyticsMatchFilter(req);
    if (!matchFilter) {
      return res.status(400).json({ success: false, message: 'Invalid projectId or departmentId' });
    }

    const [statusCounts, priorityCounts, avgCompletionTime, slaStats, recentActivity] = await Promise.all([
      // Status distribution
      WorkflowInstance.aggregate([
        { $match: matchFilter },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      // Priority distribution
      WorkflowInstance.aggregate([
        { $match: { ...matchFilter, status: 'active' } },
        { $group: { _id: '$priority', count: { $sum: 1 } } }
      ]),
      // Average completion time (in hours)
      WorkflowInstance.aggregate([
        { $match: { ...matchFilter, status: 'completed', completedAt: { $exists: true } } },
        {
          $project: {
            duration: { $subtract: ['$completedAt', '$startedAt'] }
          }
        },
        { $group: { _id: null, avgDuration: { $avg: '$duration' } } }
      ]),
      // SLA breach stats
      WorkflowInstance.aggregate([
        { $match: matchFilter },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            breached: { $sum: { $cond: ['$slaBreached', 1, 0] } }
          }
        }
      ]),
      // Recent activity (last 10)
      WorkflowInstance.find(matchFilter)
        .sort({ updatedAt: -1 })
        .limit(10)
        .select('templateName entityTitle status priority currentStepName updatedAt')
        .populate('initiatedBy', 'name')
    ]);

    const stats = {
      statusDistribution: statusCounts.reduce((acc: any, item: any) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      priorityDistribution: priorityCounts.reduce((acc: any, item: any) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      avgCompletionTimeHours: avgCompletionTime[0]
        ? Math.round(avgCompletionTime[0].avgDuration / 3600000)
        : 0,
      sla: {
        total: slaStats[0]?.total || 0,
        breached: slaStats[0]?.breached || 0,
        complianceRate: slaStats[0]?.total
          ? Math.round(((slaStats[0].total - slaStats[0].breached) / slaStats[0].total) * 100)
          : 100
      },
      recentActivity
    };

    res.json({ success: true, data: stats });
  } catch (error: any) {
    logger.error('Get workflow dashboard stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to load workflow stats' });
  }
};

/**
 * Get workflow performance report by template
 */
export const getPerformanceReport = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { dateFrom, dateTo } = req.query;

    const matchFilter: any = { status: 'completed' };
    if (dateFrom || dateTo) {
      matchFilter.completedAt = {};
      if (dateFrom) matchFilter.completedAt.$gte = new Date(String(dateFrom));
      if (dateTo) matchFilter.completedAt.$lte = new Date(String(dateTo));
    }
    if (!canManageWorkflows(req.user)) {
      matchFilter.participants = new mongoose.Types.ObjectId(req.user._id.toString());
    }

    const report = await WorkflowInstance.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$templateId',
          templateName: { $first: '$templateName' },
          totalCompleted: { $sum: 1 },
          avgDuration: { $avg: { $subtract: ['$completedAt', '$startedAt'] } },
          slaBreaches: { $sum: { $cond: ['$slaBreached', 1, 0] } },
          avgProgress: { $avg: '$progress' }
        }
      },
      { $sort: { totalCompleted: -1 } }
    ]);

    const formattedReport = report.map(item => ({
      templateId: item._id,
      templateName: item.templateName,
      totalCompleted: item.totalCompleted,
      avgDurationHours: Math.round(item.avgDuration / 3600000),
      slaBreaches: item.slaBreaches,
      slaComplianceRate: Math.round(((item.totalCompleted - item.slaBreaches) / item.totalCompleted) * 100)
    }));

    res.json({ success: true, data: formattedReport });
  } catch (error: any) {
    logger.error('Get workflow performance report error:', error);
    res.status(500).json({ success: false, message: 'Failed to load performance report' });
  }
};

/**
 * Get bottleneck analysis - which steps take the longest
 */
export const getBottleneckAnalysis = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { templateId } = req.query;
    if (templateId !== undefined && isInvalidId(templateId)) {
      return res.status(400).json({ success: false, message: 'Invalid templateId' });
    }

    const matchFilter: any = { status: 'completed' };
    if (templateId) matchFilter.templateId = new mongoose.Types.ObjectId(String(templateId));
    if (!canManageWorkflows(req.user)) {
      matchFilter.participants = new mongoose.Types.ObjectId(req.user._id.toString());
    }

    const analysis = await WorkflowInstance.aggregate([
      { $match: matchFilter },
      { $unwind: '$steps' },
      { $match: { 'steps.status': 'completed', 'steps.startedAt': { $exists: true }, 'steps.completedAt': { $exists: true } } },
      {
        $group: {
          _id: { stepId: '$steps.stepId', stepName: '$steps.stepName', stepType: '$steps.stepType' },
          avgDuration: { $avg: { $subtract: ['$steps.completedAt', '$steps.startedAt'] } },
          maxDuration: { $max: { $subtract: ['$steps.completedAt', '$steps.startedAt'] } },
          count: { $sum: 1 },
          slaBreaches: { $sum: { $cond: ['$steps.slaBreached', 1, 0] } }
        }
      },
      { $sort: { avgDuration: -1 } },
      { $limit: 20 }
    ]);

    const formattedAnalysis = analysis.map(item => ({
      stepId: item._id.stepId,
      stepName: item._id.stepName,
      stepType: item._id.stepType,
      avgDurationHours: Math.round(item.avgDuration / 3600000 * 10) / 10,
      maxDurationHours: Math.round(item.maxDuration / 3600000 * 10) / 10,
      executionCount: item.count,
      slaBreaches: item.slaBreaches
    }));

    res.json({ success: true, data: formattedAnalysis });
  } catch (error: any) {
    logger.error('Get bottleneck analysis error:', error);
    res.status(500).json({ success: false, message: 'Failed to load bottleneck analysis' });
  }
};
