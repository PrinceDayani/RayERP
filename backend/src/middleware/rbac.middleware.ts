import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import { Role } from '../models/Role';
import Employee from '../models/Employee';
import Department from '../models/Department';

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
      const user = await User.findById(userId).populate('role');
      
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      const userRole = user.role as any;
      
      if (userRole?.level >= 80) {
        return next();
      }

      const userPermissions = new Set<string>();
      
      if (userRole?.permissions) {
        userRole.permissions.forEach((perm: string) => userPermissions.add(perm));
      }

      // Check department permissions
      const employee = await Employee.findOne({ email: user.email });
      if (employee) {
        const departmentNames = employee.departments || (employee.department ? [employee.department] : []);
        if (departmentNames.length > 0) {
          const departments = await Department.find({ 
            name: { $in: departmentNames },
            status: 'active'
          });
          departments.forEach(dept => {
            if (dept.permissions && dept.permissions.length > 0) {
              dept.permissions.forEach((perm: string) => userPermissions.add(perm));
            }
          });
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
      const user = await User.findById(userId).populate('role');
      
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      const userRole = user.role as any;
      
      if (userRole?.level >= 80) {
        return next();
      }

      const userPermissions = new Set<string>();
      
      if (userRole?.permissions) {
        userRole.permissions.forEach((perm: string) => userPermissions.add(perm));
      }

      // Check department permissions
      const employee = await Employee.findOne({ email: user.email });
      if (employee) {
        const departmentNames = employee.departments || (employee.department ? [employee.department] : []);
        if (departmentNames.length > 0) {
          const departments = await Department.find({ 
            name: { $in: departmentNames },
            status: 'active'
          });
          departments.forEach(dept => {
            if (dept.permissions && dept.permissions.length > 0) {
              dept.permissions.forEach((perm: string) => userPermissions.add(perm));
            }
          });
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