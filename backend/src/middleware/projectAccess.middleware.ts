import { Request, Response, NextFunction } from 'express';
import Project from '../models/Project';
import Employee from '../models/Employee';
import ProjectPermission from '../models/ProjectPermission';

export const checkProjectAccess = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectId = req.params.id;
    const user = req.user;

    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const userRole = (user.role as any);
    const roleName = typeof user.role === 'object' && 'name' in user.role ? user.role.name : null;
    const rolePermissions = (typeof user.role === 'object' && 'permissions' in user.role ? user.role.permissions : []) as string[];
    
    // Root or users with projects.view_all permission get full access
    if (roleName === 'Root' || rolePermissions.includes('projects.view_all')) {
      return next();
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Check User-based access (owner, members)
    const isOwner = project.owner.toString() === user._id.toString();
    const isMember = project.team.some(memberId => memberId.toString() === user._id.toString());
    
    // Check Employee-based access (team, manager)
    const employee = await Employee.findOne({ user: user._id });
    let isTeamMember = false;
    let isManager = false;
    let hasProjectPermission = false;
    
    if (employee) {
      isTeamMember = project.team && project.team.some(teamId => teamId.toString() === employee._id.toString());
      isManager = project.managers && project.managers.some(managerId => managerId.toString() === employee._id.toString());
      
      // Check if user has any ProjectPermission record for this project
      const projectPermission = await ProjectPermission.findOne({
        project: projectId,
        employee: employee._id
      });
      hasProjectPermission = !!projectPermission;
    }

    const hasAccess = isOwner || isMember || isTeamMember || isManager || hasProjectPermission;

    if (!hasAccess) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    next();
  } catch (error) {
    console.error('Project access middleware error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const checkProjectManagementAccess = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const userRole = (user.role as any);
    if (userRole?.name !== 'Root' && userRole?.name !== 'Superadmin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    next();
  } catch (error) {
    console.error('Project management access middleware error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
