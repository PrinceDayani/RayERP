import ActivityLog from '../models/ActivityLog';
import mongoose from 'mongoose';

interface LogActivityParams {
  userId: string | mongoose.Types.ObjectId;
  userName: string;
  action: 'create' | 'update' | 'delete' | 'share' | 'comment' | 'assign' | 'complete' | 'view' | 'login' | 'logout' | 'upload' | 'download' | 'approve' | 'reject' | 'archive' | 'restore' | 'export' | 'import';
  resource: string;
  resourceType: 'project' | 'task' | 'file' | 'comment' | 'employee' | 'budget' | 'user' | 'role' | 'department' | 'report' | 'notification' | 'system' | 'auth' | 'other';
  resourceId?: string | mongoose.Types.ObjectId;
  projectId?: string | mongoose.Types.ObjectId;
  details: string;
  metadata?: any;
  visibility?: 'all' | 'management' | 'project_team' | 'private';
  ipAddress?: string;
  status?: 'success' | 'error' | 'warning';
  category?: 'system' | 'user' | 'project' | 'security' | 'data';
  severity?: 'low' | 'medium' | 'high' | 'critical';
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
      metadata: {
        ...params.metadata,
        category: params.category || 'user',
        severity: params.severity || 'low',
        timestamp: new Date().toISOString()
      },
      visibility: params.visibility || 'all',
      ipAddress: params.ipAddress || 'system',
      status: params.status || 'success'
    });
  } catch (error) {
    console.error('Error logging activity:', error);
  }
};

// Helper functions for common activity types
export const logUserActivity = async (userId: string, userName: string, action: string, details: string, metadata?: any) => {
  await logActivity({
    userId,
    userName,
    action: action as any,
    resource: 'User Account',
    resourceType: 'user',
    details,
    metadata,
    category: 'user'
  });
};

export const logSystemActivity = async (action: string, resource: string, details: string, metadata?: any) => {
  await logActivity({
    userId: 'system',
    userName: 'System',
    action: action as any,
    resource,
    resourceType: 'system',
    details,
    metadata,
    category: 'system',
    visibility: 'management'
  });
};

export const logSecurityActivity = async (userId: string, userName: string, action: string, details: string, metadata?: any) => {
  await logActivity({
    userId,
    userName,
    action: action as any,
    resource: 'Security Event',
    resourceType: 'auth',
    details,
    metadata,
    category: 'security',
    severity: 'high',
    visibility: 'management'
  });
};
