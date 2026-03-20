import { Role } from '../models/Role';
import Project from '../models/Project';
import mongoose from 'mongoose';
import { ADMIN_ROLE_LEVEL } from '../constants/activity.constants';

// Cache for user project IDs
let userProjectCache: Map<string, { projectIds: mongoose.Types.ObjectId[]; timestamp: number }> = new Map();
const CACHE_TTL = 300000; // 5 minutes

export const clearUserProjectCache = () => {
  userProjectCache.clear();
};

export const getUserProjectIds = async (userId: string): Promise<mongoose.Types.ObjectId[]> => {
  const cached = userProjectCache.get(userId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.projectIds;
  }

  const projectIds = await Project.find({
    $or: [
      { team: userId },
      { members: userId },
      { manager: userId },
      { owner: userId }
    ]
  }).distinct('_id');

  userProjectCache.set(userId, { projectIds, timestamp: Date.now() });
  return projectIds;
};

export const getUserActivityQuery = async (userId: string, roleId: string): Promise<any> => {
  const userRole = await Role.findById(roleId).lean();
  const hasViewAllPermission = userRole?.permissions?.includes('view_all_activities') || (userRole?.level && userRole.level >= ADMIN_ROLE_LEVEL);

  let query: any = {};

  if (hasViewAllPermission) {
    query.visibility = { $in: ['all', 'management'] };
  } else {
    const projectIds = await getUserProjectIds(userId);

    query.$or = [
      { visibility: 'all' },
      { visibility: 'project_team', projectId: { $in: projectIds } },
      { user: userId }
    ];
  }

  return query;
};
