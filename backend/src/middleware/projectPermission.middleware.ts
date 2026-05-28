import { Request, Response, NextFunction } from 'express';
import ProjectPermission from '../models/ProjectPermission';

export const requireProjectPermission = (permission: string, managerOverride: boolean = false) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const projectId = req.params.id;

      if (!user) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }

      const roleName = typeof user.role === 'object' && 'name' in user.role ? user.role.name : null;
      const rolePermissions = (typeof user.role === 'object' && 'permissions' in user.role ? user.role.permissions : []) as string[];

      if (roleName === 'Root' || rolePermissions.includes('projects.manage_all') || rolePermissions.includes('*')) {
        return next();
      }

      const Project = (await import('../models/Project')).default;
      const project = await Project.findById(projectId);

      if (!project) {
        return res.status(404).json({ success: false, message: 'Project not found' });
      }

      if (project.owner.toString() === user._id.toString()) {
        return next();
      }

      if (managerOverride) {
        const isManager = project.managers?.some(managerId => managerId.toString() === user._id.toString());
        if (isManager) return next();
      }

      const projectPermission = await ProjectPermission.findOne({
        project: projectId,
        user: user._id
      });

      if (projectPermission && projectPermission.permissions.includes(permission)) {
        return next();
      }

      if (rolePermissions.includes(permission)) {
        return next();
      }

      return res.status(403).json({
        success: false,
        message: `Access denied: Missing permission '${permission}' for this project`
      });

    } catch (error) {
      console.error('Error checking project permission:', error);
      return res.status(500).json({
        success: false,
        message: 'Error checking permissions'
      });
    }
  };
};

export const checkProjectPermissions = async (userId: string, projectId: string, requiredPermissions: string[]): Promise<boolean> => {
  try {
    const projectPermission = await ProjectPermission.findOne({
      project: projectId,
      user: userId
    });

    if (!projectPermission) return false;

    return requiredPermissions.every(permission =>
      projectPermission.permissions.includes(permission)
    );
  } catch (error) {
    console.error('Error checking project permissions:', error);
    return false;
  }
};
