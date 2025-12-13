//path: backend/src/controllers/projectController.ts
import { Request, Response } from 'express';
import Project from '../models/Project';
import Task from '../models/Task';
import { createTimelineEvent, getEntityTimeline } from '../utils/timelineHelper';
// Socket will be imported dynamically to avoid circular dependency

// Helper function to emit updated project stats
const emitProjectStats = async () => {
  try {
    const totalProjects = await Project.countDocuments();
    const activeProjects = await Project.countDocuments({ status: 'active' });
    const completedProjects = await Project.countDocuments({ status: 'completed' });
    const overdueTasks = await Task.countDocuments({ 
      dueDate: { $lt: new Date() }, 
      status: { $ne: 'completed' } 
    });
    
    const stats = {
      totalProjects,
      activeProjects,
      completedProjects,
      overdueTasks,
      totalTasks: await Task.countDocuments(),
      completedTasks: await Task.countDocuments({ status: 'completed' })
    };
    
    const { io } = await import('../server');
    io.emit('project:stats', stats);
  } catch (error) {
    console.error('Error emitting project stats:', error);
  }
};

export const getAllProjects = async (req: Request, res: Response) => {
  try {
    console.log('\n=== GET ALL PROJECTS REQUEST ===');
    const user = req.user;
    if (!user) {
      console.log('❌ No user found in request');
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    console.log('User:', { id: user._id, name: user.name, email: user.email });
    const userRole = user.role as any;
    const roleName = typeof user.role === 'object' && 'name' in user.role ? user.role.name : null;
    const rolePermissions = (typeof user.role === 'object' && 'permissions' in user.role ? user.role.permissions : []) as string[];
    console.log('Role info:', { level: userRole?.level, name: roleName, roleType: typeof user.role, permissions: rolePermissions });
    console.log('Has projects.view_all?', rolePermissions.includes('projects.view_all'));
    
    // Root or users with projects.view_all permission get full access to all projects
    if (roleName === 'Root' || rolePermissions.includes('projects.view_all')) {
      console.log(`✅ ROOT ACCESS - User ${user.name} fetching all projects`);
      const count = await Project.countDocuments();
      console.log(`Total projects in DB: ${count}`);
      
      const projects = await Project.find({})
        .populate({ path: 'manager', select: 'firstName lastName', strictPopulate: false })
        .populate({ path: 'team', select: 'firstName lastName', strictPopulate: false })
        .populate({ path: 'owner', select: 'name email', strictPopulate: false })
        .populate({ path: 'members', select: 'name email', strictPopulate: false })
        .populate({ path: 'departments', select: 'name description', strictPopulate: false });
      
      console.log(`✅ Returning ${projects.length} projects:`, projects.map(p => ({ id: p._id, name: p.name })));
      console.log('=== END REQUEST ===\n');
      return res.json(projects);
    }
    console.log('⚠️ User is not root, applying filters...');

    // Get user's department permissions
    const Employee = (await import('../models/Employee')).default;
    const Department = (await import('../models/Department')).default;
    const employee = await Employee.findOne({ user: user._id });
    
    let hasProjectViewPermission = false;
    if (employee) {
      const departmentNames = employee.departments || (employee.department ? [employee.department] : []);
      if (departmentNames.length > 0) {
        const departments = await Department.find({ name: { $in: departmentNames }, status: 'active' });
        hasProjectViewPermission = departments.some(dept => 
          dept.permissions && dept.permissions.includes('projects.view')
        );
      }
    }

    // Find projects user is assigned to (full access)
    const assignedConditions: any[] = [
      { members: user._id },
      { owner: user._id }
    ];
    
    if (employee) {
      assignedConditions.push({ team: employee._id });
      assignedConditions.push({ manager: employee._id });
    }
    
    const assignedProjects = await Project.find({ $or: assignedConditions })
      .populate({ path: 'manager', select: 'firstName lastName', strictPopulate: false })
      .populate({ path: 'team', select: 'firstName lastName', strictPopulate: false })
      .populate({ path: 'owner', select: 'name email', strictPopulate: false })
      .populate({ path: 'members', select: 'name email', strictPopulate: false })
      .populate({ path: 'departments', select: 'name description', strictPopulate: false });

    // If user has department permission, also show basic info of department projects
    if (hasProjectViewPermission && employee) {
      const departmentNames = employee.departments || (employee.department ? [employee.department] : []);
      const departmentProjects = await Project.find({ 
        departments: { $in: departmentNames },
        _id: { $nin: assignedProjects.map(p => p._id) } // Exclude already assigned projects
      }).select('name status priority startDate endDate departments');
      
      // Return assigned projects with full details + department projects with basic info
      return res.json([
        ...assignedProjects,
        ...departmentProjects.map(p => ({
          _id: p._id,
          name: p.name,
          status: p.status,
          priority: p.priority,
          startDate: p.startDate,
          endDate: p.endDate,
          departments: p.departments,
          isBasicView: true // Flag to indicate limited access
        }))
      ]);
    }
    
    // Return only assigned projects
    res.json(assignedProjects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ message: 'Error fetching projects', error: error instanceof Error ? error.message : 'Unknown error' });
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
        .populate({ path: 'manager', select: 'firstName lastName', strictPopulate: false })
        .populate({ path: 'team', select: 'firstName lastName', strictPopulate: false })
        .populate({ path: 'owner', select: 'name email', strictPopulate: false })
        .populate({ path: 'members', select: 'name email', strictPopulate: false })
        .populate({ path: 'departments', select: 'name description', strictPopulate: false });
      
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
      return res.json(project);
    }

    const project = await Project.findById(req.params.id)
      .populate({ path: 'manager', select: 'firstName lastName', strictPopulate: false })
      .populate({ path: 'team', select: 'firstName lastName', strictPopulate: false })
      .populate({ path: 'owner', select: 'name email', strictPopulate: false })
      .populate({ path: 'members', select: 'name email', strictPopulate: false })
      .populate({ path: 'departments', select: 'name description', strictPopulate: false });
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user is assigned to project
    const isMember = project.members.some(m => m && m._id && m._id.toString() === user._id.toString());
    const isOwner = project.owner && project.owner._id && project.owner._id.toString() === user._id.toString();
    
    const Employee = (await import('../models/Employee')).default;
    const employee = await Employee.findOne({ user: user._id });
    
    let isTeamMember = false;
    let isManager = false;
    
    if (employee) {
      isTeamMember = project.team && project.team.some((t: any) => t && t._id && t._id.toString() === employee._id.toString());
      isManager = project.manager && project.manager._id && project.manager._id.toString() === employee._id.toString();
    }
    
    const isAssigned = isMember || isOwner || isTeamMember || isManager;
    
    // If assigned, return full project details
    if (isAssigned) {
      return res.json(project);
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
            _id: project._id,
            name: project.name,
            status: project.status,
            priority: project.priority,
            startDate: project.startDate,
            endDate: project.endDate,
            departments: project.departments,
            isBasicView: true
          });
        }
      }
    }
    
    return res.status(403).json({ message: 'Access denied: You are not assigned to this project' });
  } catch (error) {
    console.error('Error fetching project by ID:', error);
    res.status(500).json({ message: 'Error fetching project', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const createProject = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const projectData = {
      ...req.body,
      owner: user._id,
      members: req.body.members || [],
      departments: req.body.departments || [],
      milestones: req.body.milestones || [],
      risks: req.body.risks || [],
      dependencies: req.body.dependencies || []
    };
    
    const project = new Project(projectData);
    await project.save();
    await project.populate('manager', 'firstName lastName');
    await project.populate('team', 'firstName lastName');
    await project.populate('owner', 'name email');
    await project.populate('members', 'name email');
    await project.populate('departments', 'name description');
    await project.populate('dependencies', 'name');
    
    // Safely get manager ID
    const managerId = project.manager ? 
                     (project.manager._id?.toString() || project.manager.toString()) : 
                     req.body.manager;
    
    if (!managerId) {
      return res.status(400).json({ message: 'Manager is required for timeline event' });
    }
    
    // Create timeline event
    await createTimelineEvent(
      'project',
      project._id.toString(),
      'created',
      'Project Created',
      `Project "${project.name}" was created`,
      managerId
    );
    
    // Emit socket events
    const { io } = await import('../server');
    io.emit('project:created', project);
    await emitProjectStats();
    
    // Log project creation activity
    const { logActivity } = await import('../utils/activityLogger');
    await logActivity({
      userId: user._id.toString(),
      userName: user.name,
      action: 'create',
      resource: `Project: ${project.name}`,
      resourceType: 'project',
      resourceId: project._id.toString(),
      projectId: project._id.toString(),
      details: `Created new project "${project.name}" with status ${project.status}`,
      metadata: { 
        projectId: project._id, 
        projectName: project.name, 
        status: project.status,
        budget: project.budget,
        startDate: project.startDate,
        endDate: project.endDate
      },
      category: 'project',
      severity: 'medium',
      ipAddress: req.ip || req.socket.remoteAddress || 'unknown'
    });

    // Emit dashboard stats update
    const { RealTimeEmitter } = await import('../utils/realTimeEmitter');
    await RealTimeEmitter.emitDashboardStats();
    await RealTimeEmitter.emitActivityLog({
      type: 'project',
      message: `New project "${project.name}" created`,
      user: user.name || 'System',
      userId: user._id?.toString(),
      metadata: { projectId: project._id, projectName: project.name, status: project.status }
    });
    
    res.status(201).json(project);
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(400).json({ message: 'Error creating project', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const updateProject = async (req: Request, res: Response) => {
  try {
    const oldProject = await Project.findById(req.params.id);
    if (!oldProject) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('manager', 'firstName lastName')
     .populate('team', 'firstName lastName')
     .populate('owner', 'name email')
     .populate('members', 'name email')
     .populate('departments', 'name description');
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found after update' });
    }
    
    // Safely get manager ID for timeline
    const managerId = req.body.updatedBy || 
                     (project.manager ? 
                      (project.manager._id?.toString() || project.manager.toString()) : 
                      null);
    
    if (!managerId) {
      return res.status(400).json({ message: 'Unable to determine user for timeline event' });
    }
    
    // Create timeline event
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
    
    // Emit socket events
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
        changes: Object.keys(req.body)
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
    
    res.json(project);
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(400).json({ message: 'Error updating project', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const updateProjectStatus = async (req: Request, res: Response) => {
  try {
    const { status, user } = req.body;
    
    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }
    
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    const oldStatus = project.status;
    project.status = status;
    await project.save();
    await project.populate('manager', 'firstName lastName');
    await project.populate('team', 'firstName lastName');
    await project.populate('owner', 'name email');
    await project.populate('members', 'name email');
    await project.populate('departments', 'name description');
    
    // Safely get user ID
    const userId = user || (project.manager ? 
                           (project.manager._id?.toString() || project.manager.toString()) : 
                           null);
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required for timeline event' });
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
    
    const { io } = await import('../server');
    io.emit('project:status:updated', project);
    await emitProjectStats();
    
    // Emit dashboard stats update
    const { RealTimeEmitter } = await import('../utils/realTimeEmitter');
    await RealTimeEmitter.emitDashboardStats();
    
    res.json(project);
  } catch (error) {
    console.error('Error updating project status:', error);
    res.status(400).json({ message: 'Error updating project status', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const deleteProject = async (req: Request, res: Response) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    await Task.deleteMany({ project: req.params.id });
    
    // Safely get manager ID
    const managerId = project.manager ? project.manager.toString() : null;
    
    if (managerId) {
      // Create timeline event
      await createTimelineEvent(
        'project',
        req.params.id,
        'deleted',
        'Project Deleted',
        `Project "${project.name}" was deleted`,
        managerId
      );
    }
    
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
      details: `Deleted project "${project.name}" and all associated tasks`,
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
    
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ message: 'Error deleting project', error: error instanceof Error ? error.message : 'Unknown error' });
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
    const isMember = project.members.some(m => m.toString() === user._id.toString());
    const isOwner = project.owner.toString() === user._id.toString();
    
    // Find employee record to check team/manager fields
    const Employee = (await import('../models/Employee')).default;
    const employee = await Employee.findOne({ user: user._id });
    
    let isTeamMember = false;
    let isManager = false;
    
    if (employee) {
      isTeamMember = project.team && project.team.some((t: any) => t.toString() === employee._id.toString());
      isManager = project.manager && project.manager.toString() === employee._id.toString();
    }
    
    if (roleName !== 'Root' && !rolePermissions.includes('projects.view_all') && !isMember && !isOwner && !isTeamMember && !isManager) {
      return res.status(403).json({ message: 'Access denied: You are not assigned to this project' });
    }

    const tasks = await Task.find({ project: req.params.id })
      .populate('assignedTo', 'firstName lastName')
      .populate('assignedBy', 'firstName lastName');
    
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
    await task.populate('assignedTo', 'firstName lastName');
    await task.populate('assignedBy', 'firstName lastName');
    
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
        console.error('Timeline event creation failed:', timelineError);
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
    console.error('Error creating project task:', error);
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
    if (roleName !== 'Root' && !rolePermissions.includes('projects.view_all')) {
      const Employee = (await import('../models/Employee')).default;
      const employee = await Employee.findOne({ user: user._id });
      
      const conditions: any[] = [
        { members: user._id },
        { owner: user._id }
      ];
      
      if (employee) {
        conditions.push({ team: employee._id });
        conditions.push({ manager: employee._id });
      }
      
      query = { $or: conditions };
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
    
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching project stats', error });
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
    await clonedProject.populate('manager', 'firstName lastName');
    await clonedProject.populate('team', 'firstName lastName');
    await clonedProject.populate('owner', 'name email');
    await clonedProject.populate('departments', 'name description');
    
    const { io } = await import('../server');
    io.emit('project:created', clonedProject);
    await emitProjectStats();
    
    // Emit dashboard stats update
    const { RealTimeEmitter } = await import('../utils/realTimeEmitter');
    await RealTimeEmitter.emitDashboardStats();
    
    res.status(201).json(clonedProject);
  } catch (error) {
    console.error('Error cloning project:', error);
    res.status(400).json({ message: 'Error cloning project', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const updateProjectMilestones = async (req: Request, res: Response) => {
  try {
    const { milestones } = req.body;
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { milestones },
      { new: true, runValidators: true }
    );
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    const { io } = await import('../server');
    io.emit('project:milestones:updated', { projectId: project._id, milestones: project.milestones });
    
    res.json(project);
  } catch (error) {
    res.status(400).json({ message: 'Error updating milestones', error });
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
      return res.status(404).json({ message: 'Project not found' });
    }
    
    const { io } = await import('../server');
    io.emit('project:risks:updated', { projectId: project._id, risks: project.risks });
    
    res.json(project);
  } catch (error) {
    res.status(400).json({ message: 'Error updating risks', error });
  }
};

export const calculateProjectProgress = async (req: Request, res: Response) => {
  try {
    const projectId = req.params.id;
    const project = await Project.findById(projectId);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    const tasks = await Task.find({ project: projectId });
    
    if (tasks.length === 0) {
      return res.json({ progress: 0, message: 'No tasks found' });
    }
    
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const progress = Math.round((completedTasks / tasks.length) * 100);
    
    project.progress = progress;
    await project.save();
    
    const { io } = await import('../server');
    io.emit('project:progress:updated', { projectId, progress });
    
    res.json({ progress, totalTasks: tasks.length, completedTasks });
  } catch (error) {
    res.status(500).json({ message: 'Error calculating progress', error });
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
      .populate('assignedTo', 'firstName lastName')
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
    console.error('Error fetching project timeline data:', error);
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
    
    if (roleName === 'Root' || rolePermissions.includes('projects.view_all')) {
      query = {};
    } else {
      // Find employee record linked to this user
      const Employee = (await import('../models/Employee')).default;
      const employee = await Employee.findOne({ user: user._id });
      
      const conditions: any[] = [
        { members: user._id },
        { owner: user._id }
      ];
      
      // If user has an employee record, check team and manager fields
      if (employee) {
        conditions.push({ team: employee._id });
        conditions.push({ manager: employee._id });
      }
      
      query = { $or: conditions };
    }

    const projects = await Project.find(query).select('name startDate endDate status');
    const projectIds = projects.map(p => p._id);
    
    // Only fetch tasks from projects the user has access to
    const allTasks = await Task.find({ project: { $in: projectIds } })
      .populate('assignedTo', 'firstName lastName')
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
    console.error('Error fetching all projects timeline data:', error);
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
    ).populate('assignedTo', 'firstName lastName')
     .populate('assignedBy', 'firstName lastName');
    
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
    console.error('Error updating project task:', error);
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
    console.error('Error deleting project task:', error);
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
    console.error('Error fetching project timeline:', error);
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

    if (project.members.includes(memberId)) {
      return res.status(400).json({ success: false, message: 'User is already a member' });
    }

    project.members.push(memberId);
    await project.save();
    await project.populate('members', 'name email');
    
    res.json({ success: true, message: 'Member added successfully', members: project.members });
  } catch (error) {
    console.error('Error adding project member:', error);
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

    project.members = project.members.filter(id => id.toString() !== memberId);
    await project.save();
    await project.populate('members', 'name email');
    
    res.json({ success: true, message: 'Member removed successfully', members: project.members });
  } catch (error) {
    console.error('Error removing project member:', error);
    res.status(500).json({ success: false, message: 'Error removing member', error });
  }
};

export const getProjectMembers = async (req: Request, res: Response) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('members', 'name email');
    
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    
    res.json({ 
      success: true, 
      owner: project.owner,
      members: project.members 
    });
  } catch (error) {
    console.error('Error fetching project members:', error);
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
    console.error('Error fetching project activity:', error);
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
    
    let query: any = {};
    const roleName = typeof user.role === 'object' && 'name' in user.role ? user.role.name : null;
    const rolePermissions = (typeof user.role === 'object' && 'permissions' in user.role ? user.role.permissions : []) as string[];
    
    if (roleName !== 'Root' && !rolePermissions.includes('projects.view_all')) {
      const Employee = (await import('../models/Employee')).default;
      const employee = await Employee.findOne({ user: user._id });
      
      const conditions: any[] = [
        { members: user._id },
        { owner: user._id }
      ];
      
      if (employee) {
        conditions.push({ team: employee._id });
        conditions.push({ manager: employee._id });
      }
      
      query = { $or: conditions };
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
      .populate('manager', 'firstName lastName')
      .populate('team', 'firstName lastName')
      .populate('owner', 'name email')
      .populate('members', 'name email')
      .populate('departments', 'name description')
      .sort({ updatedAt: -1 });
    
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching projects by view', error });
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
    res.json(templates);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching templates', error });
  }
};