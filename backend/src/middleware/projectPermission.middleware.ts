import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import Employee from '../models/Employee';
import Department from '../models/Department';
import Project from '../models/Project';

const getUserPermissions = async (userId: string): Promise<Set<string>> => {
  const user = await User.findById(userId).populate('role');
  if (!user) return new Set();
  
  const userRole = user.role as any;
  const roleName = userRole?.name;
  
  // Root gets full access
  if (roleName === 'Root') return new Set(['*']);
  
  const permissions = new Set<string>();
  
  // Add role permissions
  if (userRole?.permissions) {
    userRole.permissions.forEach((perm: string) => permissions.add(perm));
  }
  
  // Add department permissions
  const employee = await Employee.findOne({ email: user.email });
  if (employee) {
    const departmentNames = employee.departments || (employee.department ? [employee.department] : []);
    if (departmentNames.length > 0) {
      const departments = await Department.find({ name: { $in: departmentNames }, status: 'active' });
      departments.forEach(dept => {
        if (dept.permissions) dept.permissions.forEach((perm: string) => permissions.add(perm));
      });
    }
  }
  
  return permissions;
};

const isProjectLead = async (userId: string, projectId: string): Promise<boolean> => {
  const project = await Project.findById(projectId);
  return project?.manager?.toString() === userId;
};

const isProjectMember = async (userId: string, projectId: string): Promise<boolean> => {
  const project = await Project.findById(projectId);
  return project?.members?.some(m => m.toString() === userId) || 
         project?.team?.some(t => t.toString() === userId);
};

export const requireProjectPermission = (permission: string, requiresAssignment = false) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) return res.status(401).json({ message: 'Authentication required' });

      const userId = req.user.id;
      const projectId = req.params.id;
      
      const user = await User.findById(userId).populate('role');
      if (!user) return res.status(401).json({ message: 'User not found' });
      
      const userRole = user.role as any;
      const roleName = userRole?.name;
      
      // Root bypasses all checks
      if (roleName === 'Root') return next();

      // Get all permissions (role + department)
      const permissions = await getUserPermissions(userId);
      
      // Check for wildcard or specific permission
      if (permissions.has('*') || permissions.has(permission)) {
        // If user has the permission, check if assignment is required
        if (requiresAssignment && projectId) {
          const isMember = await isProjectMember(userId, projectId);
          const isLead = await isProjectLead(userId, projectId);
          if (!isMember && !isLead) {
            return res.status(403).json({ 
              message: 'Assignment required for this operation',
              required: 'Project assignment'
            });
          }
        }
        return next();
      }

      // Check if assigned to project (full access for assigned users)
      if (projectId) {
        const isMember = await isProjectMember(userId, projectId);
        const isLead = await isProjectLead(userId, projectId);
        if (isMember || isLead) return next();
      }

      return res.status(403).json({ 
        message: 'Permission denied',
        required: permission
      });
    } catch (error) {
      console.error('Project permission error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };
};
