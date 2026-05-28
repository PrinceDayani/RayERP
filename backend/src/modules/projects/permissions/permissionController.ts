import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Project from '../../../models/Project';
import User from '../../../models/User';
import ProjectPermission from '../../../models/ProjectPermission';

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

    if (roleName === 'Root' || permissions.includes('projects.view_all') || permissions.includes('*')) return true;

    const project = await Project.findById(projectId);
    if (!project) return false;

    const uid = userId.toString();
    if (project.owner?.toString() === uid) return true;
    if (project.team?.some((t: any) => t.toString() === uid)) return true;
    if (project.managers?.some((m: any) => m.toString() === uid)) return true;

    const perm = await ProjectPermission.findOne({ project: projectId, user: userId });
    if (perm) return true;

    return false;
  } catch {
    return false;
  }
};
