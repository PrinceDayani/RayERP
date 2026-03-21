import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Project from '../../../models/Project';
import User from '../../../models/User';
import ProjectPermission from '../../../models/ProjectPermission';

// Re-export from existing projectPermissionController
export {
  getProjectPermissions,
  setProjectPermissions,
  removeProjectPermissions,
  getEmployeeProjectPermissions
} from '../../../controllers/projectPermissionController';

export const hasProjectAccess = async (userId: any, projectId: string): Promise<boolean> => {
  try {
    if (!userId || !projectId) return false;

    const user = await User.findById(userId).populate('role');
    if (!user) return false;

    const role = user.role as any;
    const roleName = role?.name;
    const permissions = role?.permissions || [];

    if (roleName === 'Root' || permissions.includes('projects.view_all')) return true;

    const project = await Project.findById(projectId);
    if (!project) return false;

    if (project.owner?.toString() === userId.toString()) return true;

    const Employee = (await import('../../../models/Employee')).default;
    const employee = await Employee.findOne({ user: userId });
    if (employee) {
      const empId = employee._id.toString();
      if (project.team?.some((t: any) => t.toString() === empId)) return true;
      if (project.managers?.some((m: any) => m.toString() === empId)) return true;

      const perm = await ProjectPermission.findOne({ project: projectId, employee: employee._id });
      if (perm) return true;
    }

    return false;
  } catch {
    return false;
  }
};
