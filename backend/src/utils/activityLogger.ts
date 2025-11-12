import ActivityLog from '../models/ActivityLog';
import mongoose from 'mongoose';

interface LogActivityParams {
  userId: string | mongoose.Types.ObjectId;
  userName: string;
  action: 'create' | 'update' | 'delete' | 'share' | 'comment' | 'assign' | 'complete' | 'view';
  resource: string;
  resourceType: 'project' | 'task' | 'file' | 'comment' | 'employee' | 'budget' | 'other';
  resourceId?: string | mongoose.Types.ObjectId;
  projectId?: string | mongoose.Types.ObjectId;
  details: string;
  metadata?: any;
  visibility?: 'all' | 'management' | 'project_team' | 'private';
  ipAddress?: string;
  status?: 'success' | 'error' | 'warning';
}

export const logActivity = async (params: LogActivityParams) => {
  try {
    await ActivityLog.create({
      user: params.userId,
      userName: params.userName,
      action: params.action,
      resource: params.resource,
      resourceType: params.resourceType,
      resourceId: params.resourceId,
      projectId: params.projectId,
      details: params.details,
      metadata: params.metadata,
      visibility: params.visibility || 'all',
      ipAddress: params.ipAddress || 'system',
      status: params.status || 'success'
    });
  } catch (error) {
    console.error('Error logging activity:', error);
  }
};
