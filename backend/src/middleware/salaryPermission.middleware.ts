import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import Employee from '../models/Employee';
import Department from '../models/Department';

interface AuthenticatedRequest extends Request {
  user?: any;
}

/**
 * Middleware to check if user has permission to view salary
 */
export const canViewSalary = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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
    
    // Root and Super Admin have all permissions
    if (userRole?.level >= 80) {
      return next();
    }

    const userPermissions = new Set<string>();
    
    // Add role permissions
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

    if (!userPermissions.has('employees.view_salary')) {
      return res.status(403).json({ 
        message: 'Insufficient permissions to view salary information',
        required: 'employees.view_salary'
      });
    }

    next();
  } catch (error) {
    console.error('Salary permission middleware error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Middleware to check if user has permission to edit salary
 */
export const canEditSalary = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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
    
    // Root and Super Admin have all permissions
    if (userRole?.level >= 80) {
      return next();
    }

    const userPermissions = new Set<string>();
    
    // Add role permissions
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

    if (!userPermissions.has('employees.edit_salary')) {
      return res.status(403).json({ 
        message: 'Insufficient permissions to edit salary information',
        required: 'employees.edit_salary'
      });
    }

    next();
  } catch (error) {
    console.error('Salary permission middleware error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Middleware to sanitize employee data based on salary permissions
 * Removes salary field if user doesn't have view permission
 */
export const sanitizeSalaryData = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return next();
    }

    const userId = req.user.id;
    const user = await User.findById(userId).populate('role');
    
    if (!user) {
      return next();
    }

    const userRole = user.role as any;
    
    // Root and Super Admin can see everything
    if (userRole?.level >= 80) {
      req.user.canViewSalary = true;
      return next();
    }

    const userPermissions = new Set<string>();
    
    if (userRole?.permissions) {
      userRole.permissions.forEach((perm: string) => userPermissions.add(perm));
    }

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

    req.user.canViewSalary = userPermissions.has('employees.view_salary');
    next();
  } catch (error) {
    console.error('Sanitize salary middleware error:', error);
    next();
  }
};
