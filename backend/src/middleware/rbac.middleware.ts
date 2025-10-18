import { Request, Response, NextFunction } from 'express';
import User, { UserRole } from '../models/User';
import { Role } from '../models/Role';

interface AuthenticatedRequest extends Request {
  user?: any;
}

export const requirePermission = (permission: string) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const userId = req.user.id;
      const user = await User.findById(userId).populate('roles');
      
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      // Check if user has root, superadmin, or admin role (backward compatibility)
      if (user.role === UserRole.ROOT || user.role === UserRole.SUPER_ADMIN || user.role === UserRole.ADMIN) {
        return next();
      }

      // Check RBAC permissions
      const userPermissions = new Set<string>();
      
      if (user.roles && user.roles.length > 0) {
        for (const role of user.roles as any[]) {
          if (role.permissions) {
            role.permissions.forEach((perm: string) => userPermissions.add(perm));
          }
        }
      }

      if (!userPermissions.has(permission)) {
        return res.status(403).json({ 
          message: 'Insufficient permissions',
          required: permission,
          userPermissions: Array.from(userPermissions)
        });
      }

      next();
    } catch (error) {
      console.error('RBAC middleware error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };
};

export const requireAnyPermission = (permissions: string[]) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const userId = req.user.id;
      const user = await User.findById(userId).populate('roles');
      
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      // Check if user has root, superadmin, or admin role (backward compatibility)
      if (user.role === UserRole.ROOT || user.role === UserRole.SUPER_ADMIN || user.role === UserRole.ADMIN) {
        return next();
      }

      // Check RBAC permissions
      const userPermissions = new Set<string>();
      
      if (user.roles && user.roles.length > 0) {
        for (const role of user.roles as any[]) {
          if (role.permissions) {
            role.permissions.forEach((perm: string) => userPermissions.add(perm));
          }
        }
      }

      const hasPermission = permissions.some(permission => userPermissions.has(permission));
      
      if (!hasPermission) {
        return res.status(403).json({ 
          message: 'Insufficient permissions',
          required: permissions,
          userPermissions: Array.from(userPermissions)
        });
      }

      next();
    } catch (error) {
      console.error('RBAC middleware error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };
};