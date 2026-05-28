import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Project from '../models/Project';
import ProjectPermission from '../models/ProjectPermission';

type AnyUser = {
  _id: mongoose.Types.ObjectId | string;
  role?: any;
};

const isPrivilegedRole = (user: AnyUser): boolean => {
  const role = user.role;
  if (!role || typeof role !== 'object') return false;
  const name = 'name' in role ? role.name : null;
  const permissions = ('permissions' in role ? role.permissions : []) as string[];
  const level = ('level' in role ? Number(role.level) : 0) || 0;
  if (name === 'Root' || name === 'Superadmin') return true;
  if (permissions.includes('*') || permissions.includes('projects.view_all')) return true;
  if (level >= 80) return true;
  return false;
};

export const getAccessibleProjectIdsForUser = async (
  user: AnyUser
): Promise<{ all: boolean; ids: mongoose.Types.ObjectId[] }> => {
  if (!user || !user._id) {
    return { all: false, ids: [] };
  }

  if (isPrivilegedRole(user)) {
    return { all: true, ids: [] };
  }

  const userId = new mongoose.Types.ObjectId(user._id.toString());

  const [ownedOrMember, granted] = await Promise.all([
    Project.find({
      $or: [
        { owner: userId },
        { managers: userId },
        { team: userId }
      ]
    })
      .select('_id')
      .lean(),
    ProjectPermission.find({ user: userId }).select('project').lean()
  ]);

  const idSet = new Map<string, mongoose.Types.ObjectId>();
  for (const p of ownedOrMember) {
    idSet.set(p._id.toString(), p._id);
  }
  for (const pp of granted) {
    if (pp.project) {
      const pid = new mongoose.Types.ObjectId(pp.project.toString());
      idSet.set(pid.toString(), pid);
    }
  }

  return { all: false, ids: Array.from(idSet.values()) };
};

export const checkProjectAccess = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectId = req.params.id;
    const user = req.user;

    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const roleName = typeof user.role === 'object' && 'name' in user.role ? user.role.name : null;
    const rolePermissions = (typeof user.role === 'object' && 'permissions' in user.role ? user.role.permissions : []) as string[];

    if (roleName === 'Root' || rolePermissions.includes('projects.view_all') || rolePermissions.includes('*')) {
      return next();
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const userId = user._id.toString();
    const isOwner = project.owner.toString() === userId;
    const isTeamMember = !!project.team?.some(memberId => memberId.toString() === userId);
    const isManager = !!project.managers?.some(managerId => managerId.toString() === userId);

    let hasProjectPermission = false;
    if (!isOwner && !isTeamMember && !isManager) {
      const projectPermission = await ProjectPermission.findOne({ project: projectId, user: user._id });
      hasProjectPermission = !!projectPermission;
    }

    if (!isOwner && !isTeamMember && !isManager && !hasProjectPermission) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    next();
  } catch (error) {
    console.error('Project access middleware error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const checkProjectManagementAccess = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const userRole = (user.role as any);
    if (userRole?.name !== 'Root' && userRole?.name !== 'Superadmin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    next();
  } catch (error) {
    console.error('Project management access middleware error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
