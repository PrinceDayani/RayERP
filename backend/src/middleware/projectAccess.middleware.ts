import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Project from '../models/Project';
import ProjectPermission from '../models/ProjectPermission';
import { logger } from '../utils/logger';

type AnyUser = {
  _id: mongoose.Types.ObjectId | string;
  role?: any;
};

export const isPrivilegedRole = (user: AnyUser): boolean => {
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

/**
 * Resolve whether a user may act on a project. Returns null when access is
 * allowed, otherwise the HTTP status and message to reply with, so the project
 * and phase middlewares report failures identically.
 */
export const resolveProjectAccess = async (
  user: AnyUser | undefined,
  projectId: string
): Promise<{ status: number; message: string } | null> => {
  if (!user) {
    return { status: 401, message: 'Authentication required' };
  }

  const roleName = typeof user.role === 'object' && 'name' in user.role ? user.role.name : null;
  const rolePermissions = (typeof user.role === 'object' && 'permissions' in user.role ? user.role.permissions : []) as string[];

  if (roleName === 'Root' || rolePermissions.includes('projects.view_all') || rolePermissions.includes('*')) {
    return null;
  }

  const project = await Project.findById(projectId);
  if (!project) {
    return { status: 404, message: 'Project not found' };
  }

  const userId = user._id.toString();
  const isOwner = project.owner.toString() === userId;
  const isTeamMember = !!project.team?.some(memberId => memberId.toString() === userId);
  const isManager = !!project.managers?.some(managerId => managerId.toString() === userId);

  if (isOwner || isTeamMember || isManager) {
    return null;
  }

  const projectPermission = await ProjectPermission.findOne({ project: projectId, user: user._id });
  if (projectPermission) {
    return null;
  }

  return { status: 403, message: 'Access denied' };
};

export const checkProjectAccess = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const denial = await resolveProjectAccess(req.user, req.params.id);
    if (denial) {
      return res.status(denial.status).json({ success: false, message: denial.message });
    }
    next();
  } catch (error: any) {
    logger.error('Project access middleware error', { message: error?.message });
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Access gate for phase-scoped routes (/api/phases/:id). Authorization is
 * inherited from the phase's parent project.
 */
export const checkPhaseAccess = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ProjectPhase = (await import('../models/ProjectPhase')).default;
    const phase = await ProjectPhase.findById(req.params.id).select('project');
    if (!phase) {
      return res.status(404).json({ success: false, message: 'Phase not found' });
    }

    const denial = await resolveProjectAccess(req.user, phase.project.toString());
    if (denial) {
      return res.status(denial.status).json({ success: false, message: denial.message });
    }
    next();
  } catch (error: any) {
    logger.error('Phase access middleware error', { message: error?.message });
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
  } catch (error: any) {
    logger.error('Project management access middleware error', { message: error?.message });
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
