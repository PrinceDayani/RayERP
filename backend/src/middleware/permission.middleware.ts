import { Request, Response, NextFunction } from 'express';
import User from '../models/User';

const ROLE_PERMISSIONS = {
  root: ['*'],
  super_admin: ['admin.*', 'users.*', 'projects.*', 'finance.*'],
  admin: ['users.*', 'projects.*', 'finance.view'],
  manager: ['projects.*', 'tasks.*', 'users.view'],
  supervisor: ['projects.view', 'tasks.*'],
  employee: ['projects.view', 'tasks.view']
};

export const requirePermission = (permission: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      if (!user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const userRole = user.role?.toLowerCase();
      
      // Check role permissions
      const rolePerms = ROLE_PERMISSIONS[userRole as keyof typeof ROLE_PERMISSIONS] || [];
      
      const hasPermission = rolePerms.some(perm => {
        if (perm === '*') return true;
        if (perm.endsWith('*')) {
          return permission.startsWith(perm.slice(0, -1));
        }
        return perm === permission;
      });

      if (!hasPermission) {
        return res.status(403).json({ 
          message: 'Insufficient permissions',
          required: permission 
        });
      }

      next();
    } catch (error) {
      res.status(500).json({ message: 'Permission check failed' });
    }
  };
};