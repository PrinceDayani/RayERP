import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import Employee from '../models/Employee';
import Department from '../models/Department';

interface AuthenticatedRequest extends Request {
  user?: any;
}

export const requireDepartmentPermission = (permission: string) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const userId = req.user.id;
      const user = await User.findById(userId);
      
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      // Find employee by email
      const employee = await Employee.findOne({ email: user.email });
      
      if (!employee) {
        return res.status(403).json({ message: 'Employee record not found' });
      }

      // Collect all department permissions
      const departmentPermissions = new Set<string>();
      const departmentNames = employee.departments || (employee.department ? [employee.department] : []);

      if (departmentNames.length > 0) {
        const departments = await Department.find({ 
          name: { $in: departmentNames },
          status: 'active'
        });

        departments.forEach(dept => {
          if (dept.permissions && dept.permissions.length > 0) {
            dept.permissions.forEach(perm => departmentPermissions.add(perm));
          }
        });
      }

      // Check if user has the required permission
      if (!departmentPermissions.has(permission)) {
        return res.status(403).json({ 
          message: 'Insufficient department permissions',
          required: permission,
          departmentPermissions: Array.from(departmentPermissions)
        });
      }

      next();
    } catch (error) {
      console.error('Department permission middleware error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };
};

export const requireAnyDepartmentPermission = (permissions: string[]) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const userId = req.user.id;
      const user = await User.findById(userId);
      
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      const employee = await Employee.findOne({ email: user.email });
      
      if (!employee) {
        return res.status(403).json({ message: 'Employee record not found' });
      }

      const departmentPermissions = new Set<string>();
      const departmentNames = employee.departments || (employee.department ? [employee.department] : []);

      if (departmentNames.length > 0) {
        const departments = await Department.find({ 
          name: { $in: departmentNames },
          status: 'active'
        });

        departments.forEach(dept => {
          if (dept.permissions && dept.permissions.length > 0) {
            dept.permissions.forEach(perm => departmentPermissions.add(perm));
          }
        });
      }

      const hasPermission = permissions.some(permission => departmentPermissions.has(permission));
      
      if (!hasPermission) {
        return res.status(403).json({ 
          message: 'Insufficient department permissions',
          required: permissions,
          departmentPermissions: Array.from(departmentPermissions)
        });
      }

      next();
    } catch (error) {
      console.error('Department permission middleware error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };
};
