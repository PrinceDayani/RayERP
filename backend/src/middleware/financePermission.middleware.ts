import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import Employee from '../models/Employee';
import Department from '../models/Department';

const checkFinanceAccess = async (req: Request): Promise<boolean> => {
  if (!req.user) return false;
  
  const user = await User.findById(req.user.id).populate('role');
  if (!user) return false;
  
  const userRole = user.role as any;
  if (userRole?.level >= 80) return true;
  
  const userPermissions = new Set<string>(userRole?.permissions || []);
  
  const employee = await Employee.findOne({ email: user.email });
  if (employee) {
    const departmentNames = employee.departments || (employee.department ? [employee.department] : []);
    if (departmentNames.length > 0) {
      const departments = await Department.find({ name: { $in: departmentNames }, status: 'active' });
      departments.forEach(dept => {
        if (dept.permissions) dept.permissions.forEach((perm: string) => userPermissions.add(perm));
      });
    }
  }
  
  return userPermissions.has('finance.view') || userPermissions.has('finance.manage');
};

export const requireFinanceAccess = (specificPermission: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const hasFinanceAccess = await checkFinanceAccess(req);
      if (!hasFinanceAccess) {
        return res.status(403).json({ 
          message: 'Finance module access required',
          required: 'finance.view or finance.manage'
        });
      }

      const user = await User.findById(req.user.id).populate('role');
      if (!user) return res.status(401).json({ message: 'User not found' });

      const userRole = user.role as any;
      if (userRole?.level >= 80) return next();

      const userPermissions = new Set<string>(userRole?.permissions || []);
      
      const employee = await Employee.findOne({ email: user.email });
      if (employee) {
        const departmentNames = employee.departments || (employee.department ? [employee.department] : []);
        if (departmentNames.length > 0) {
          const departments = await Department.find({ name: { $in: departmentNames }, status: 'active' });
          departments.forEach(dept => {
            if (dept.permissions) dept.permissions.forEach((perm: string) => userPermissions.add(perm));
          });
        }
      }

      if (!userPermissions.has(specificPermission)) {
        return res.status(403).json({ 
          message: 'Insufficient permissions',
          required: specificPermission
        });
      }

      next();
    } catch (error) {
      console.error('Finance permission error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };
};
