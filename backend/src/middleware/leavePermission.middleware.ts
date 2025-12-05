import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import Employee from '../models/Employee';
import Leave from '../models/Leave';

export const requireLeavePermission = (permission: string, allowSelfOnly = false) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) return res.status(401).json({ message: 'Authentication required' });

      const userId = req.user.id;
      const user = await User.findById(userId).populate('role');
      if (!user) return res.status(401).json({ message: 'User not found' });
      
      const userRole = user.role as any;
      // Root, Director bypass all checks
      if (userRole?.level >= 80) return next();

      const Employee = (await import('../models/Employee')).default;
      const Department = (await import('../models/Department')).default;
      
      const employee = await Employee.findOne({ user: userId });
      if (!employee) {
        return res.status(403).json({ message: 'Employee record not found' });
      }

      // Get department permissions
      const departmentNames = employee.departments || (employee.department ? [employee.department] : []);
      let hasPermission = false;
      
      if (departmentNames.length > 0) {
        const departments = await Department.find({ name: { $in: departmentNames }, status: 'active' });
        hasPermission = departments.some(dept => 
          dept.permissions && dept.permissions.includes(permission)
        );
      }

      if (!hasPermission) {
        return res.status(403).json({ 
          message: 'Department permission required',
          required: permission
        });
      }

      // For self-only operations (like applying for leave), check if it's their own record
      if (allowSelfOnly && req.method === 'POST') {
        const employeeIdFromBody = req.body.employee;
        
        if (employeeIdFromBody && employeeIdFromBody !== employee._id.toString()) {
          return res.status(403).json({ 
            message: 'You can only apply for your own leave' 
          });
        }
        
        // If no employee specified in body, set it to current user's employee
        if (!employeeIdFromBody) {
          req.body.employee = employee._id;
        }
      }

      next();
    } catch (error) {
      console.error('Leave permission error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };
};

export const requireLeaveManagerPermission = (permission: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) return res.status(401).json({ message: 'Authentication required' });

      const userId = req.user.id;
      const user = await User.findById(userId).populate('role');
      if (!user) return res.status(401).json({ message: 'User not found' });
      
      const userRole = user.role as any;
      // Root, Director bypass all checks
      if (userRole?.level >= 80) return next();

      const Employee = (await import('../models/Employee')).default;
      const Department = (await import('../models/Department')).default;
      
      const employee = await Employee.findOne({ user: userId });
      if (!employee) {
        return res.status(403).json({ message: 'Employee record not found' });
      }

      // Check if user is a manager
      const isManager = employee.position && 
        (employee.position.toLowerCase().includes('manager') || 
         employee.position.toLowerCase().includes('supervisor') ||
         employee.position.toLowerCase().includes('lead') ||
         employee.position.toLowerCase().includes('head'));

      if (!isManager) {
        // Check department permissions for manager-level permissions
        const departmentNames = employee.departments || (employee.department ? [employee.department] : []);
        let hasManagerPermission = false;
        
        if (departmentNames.length > 0) {
          const departments = await Department.find({ name: { $in: departmentNames }, status: 'active' });
          hasManagerPermission = departments.some(dept => 
            dept.permissions && dept.permissions.includes(permission)
          );
        }

        if (!hasManagerPermission) {
          return res.status(403).json({ 
            message: 'Manager-level permission required',
            required: permission
          });
        }
      }

      next();
    } catch (error) {
      console.error('Leave manager permission error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };
};