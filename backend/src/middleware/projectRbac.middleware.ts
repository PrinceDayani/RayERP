import { Request, Response, NextFunction } from 'express';
import { UserProject } from '../models/UserProject';
import { Role } from '../models/Role';
import User from '../models/User';

export const checkProjectAccess = (requiredAccessLevel: 'read' | 'write' | 'admin') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const projectId = req.params.projectId || req.body.projectId;
      const userId = req.user?.id;

      if (!projectId || !userId) {
        return res.status(400).json({ message: 'Project ID and user authentication required' });
      }

      // Check if user has project access
      const userProject = await UserProject.findOne({
        userId,
        projectId,
        isActive: true
      });

      if (!userProject) {
        return res.status(403).json({ message: 'Access denied: Not assigned to this project' });
      }

      // Check access level hierarchy
      const accessLevels = { read: 1, write: 2, admin: 3 };
      const userAccessLevel = accessLevels[userProject.accessLevel];
      const requiredLevel = accessLevels[requiredAccessLevel];

      if (userAccessLevel < requiredLevel) {
        return res.status(403).json({ 
          message: `Access denied: Requires ${requiredAccessLevel} access` 
        });
      }

      // Add project access info to request
      req.projectAccess = {
        projectId,
        accessLevel: userProject.accessLevel,
        assignedAt: userProject.assignedAt
      };

      next();
    } catch (error: any) {
      res.status(500).json({ message: 'Error checking project access', error: error.message });
    }
  };
};

export const checkRolePermission = (requiredPermission: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const user = await User.findById(userId).populate('roles');
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Check if user has required permission through any of their roles
      let hasPermission = false;
      if (user.roles) {
        for (const role of user.roles as any[]) {
          if (role.permissions.includes(requiredPermission)) {
            hasPermission = true;
            break;
          }
        }
      }

      if (!hasPermission) {
        return res.status(403).json({ 
          message: `Access denied: Requires ${requiredPermission} permission` 
        });
      }

      next();
    } catch (error: any) {
      res.status(500).json({ message: 'Error checking role permission', error: error.message });
    }
  };
};

// Combined middleware for both role and project access
export const checkRoleAndProjectAccess = (
  requiredPermission: string,
  requiredAccessLevel: 'read' | 'write' | 'admin'
) => {
  return [
    checkRolePermission(requiredPermission),
    checkProjectAccess(requiredAccessLevel)
  ];
};