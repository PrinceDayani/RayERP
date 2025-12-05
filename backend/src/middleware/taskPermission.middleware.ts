import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import Employee from '../models/Employee';
import Department from '../models/Department';
import Task from '../models/Task';
import Project from '../models/Project';

const getUserPermissions = async (userId: string): Promise<Set<string>> => {
  const user = await User.findById(userId).populate('role');
  if (!user) return new Set();
  
  const userRole = user.role as any;
  
  // Root, Director get full access (Admin removed)
  if (userRole?.level >= 80) return new Set(['*']);
  
  const permissions = new Set<string>();
  
  // Only get permissions from departments, not from role
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

const isAssignedToTask = async (userId: string, taskId: string): Promise<boolean> => {
  const task = await Task.findById(taskId);
  if (!task) return false;
  
  const Employee = (await import('../models/Employee')).default;
  const employee = await Employee.findOne({ user: userId });
  if (!employee) return false;
  
  // Check direct task assignment
  if (task.assignedTo && task.assignedTo.toString() === employee._id.toString()) {
    return true;
  }
  
  // Check project assignment
  const project = await Project.findById(task.project);
  return project?.members?.some(m => m.toString() === userId) || 
         project?.team?.some(t => t.toString() === employee._id.toString()) ||
         project?.manager?.toString() === employee._id.toString() ||
         project?.owner?.toString() === userId;
};

const isAssignedToProject = async (userId: string, projectId: string): Promise<boolean> => {
  const project = await Project.findById(projectId);
  if (!project) return false;
  
  const Employee = (await import('../models/Employee')).default;
  const employee = await Employee.findOne({ user: userId });
  if (!employee) return false;
  
  return project.members?.some(m => m.toString() === userId) || 
         project.team?.some(t => t.toString() === employee._id.toString()) ||
         project.manager?.toString() === employee._id.toString() ||
         project.owner?.toString() === userId;
};

export const requireTaskPermission = (permission: string, requiresAssignment = false) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) return res.status(401).json({ message: 'Authentication required' });

      const userId = req.user.id;
      const taskId = req.params.id;
      
      const user = await User.findById(userId).populate('role');
      if (!user) return res.status(401).json({ message: 'User not found' });
      
      const userRole = user.role as any;
      // Root, Director bypass department checks (Admin removed)
      if (userRole?.level >= 80) return next();

      // Check if assigned to task/project (full access)
      if (taskId) {
        const isAssigned = await isAssignedToTask(userId, taskId);
        if (isAssigned) return next(); // Full access for assigned users
      }

      // Check department permissions (basic access)
      const permissions = await getUserPermissions(userId);
      if (!permissions.has(permission)) {
        return res.status(403).json({ 
          message: 'Department permission required',
          required: permission
        });
      }

      // For operations requiring assignment, check assignment
      if (requiresAssignment && taskId) {
        const isAssigned = await isAssignedToTask(userId, taskId);
        if (!isAssigned) {
          return res.status(403).json({ 
            message: 'Assignment required for this operation',
            required: 'Task or project assignment'
          });
        }
      }

      next();
    } catch (error) {
      console.error('Task permission error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };
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
      // Root, Director bypass department checks (Admin removed)
      if (userRole?.level >= 80) return next();

      // Check if assigned to project (full access)
      if (projectId) {
        const isAssigned = await isAssignedToProject(userId, projectId);
        if (isAssigned) return next(); // Full access for assigned users
      }

      // Check department permissions (basic access)
      const permissions = await getUserPermissions(userId);
      if (!permissions.has(permission)) {
        return res.status(403).json({ 
          message: 'Department permission required',
          required: permission
        });
      }

      // For operations requiring assignment, check assignment
      if (requiresAssignment && projectId) {
        const isAssigned = await isAssignedToProject(userId, projectId);
        if (!isAssigned) {
          return res.status(403).json({ 
            message: 'Assignment required for this operation',
            required: 'Project assignment'
          });
        }
      }

      next();
    } catch (error) {
      console.error('Project permission error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };
};
