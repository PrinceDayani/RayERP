import { useCallback } from 'react';
import { createActivityLog } from '@/lib/api/activityAPI';

interface LogActivityParams {
  action: string;
  resource: string;
  resourceType: 'project' | 'task' | 'file' | 'comment' | 'employee' | 'budget' | 'user' | 'role' | 'department' | 'report' | 'notification' | 'system' | 'auth' | 'other';
  details: string;
  metadata?: any;
  projectId?: string;
  visibility?: 'all' | 'management' | 'project_team' | 'private';
}

export const useActivityLogger = () => {
  const logActivity = useCallback(async (params: LogActivityParams) => {
    try {
      await createActivityLog(params);
    } catch (error) {
      console.error('Failed to log activity:', error);
      // Don't throw error to avoid breaking the main functionality
    }
  }, []);

  // Convenience methods for common activities
  const logUserAction = useCallback(async (action: string, details: string, metadata?: any) => {
    await logActivity({
      action,
      resource: 'User Interface',
      resourceType: 'user',
      details,
      metadata,
      visibility: 'all'
    });
  }, [logActivity]);

  const logProjectAction = useCallback(async (action: string, projectName: string, projectId: string, details: string, metadata?: any) => {
    await logActivity({
      action,
      resource: `Project: ${projectName}`,
      resourceType: 'project',
      details,
      metadata,
      projectId,
      visibility: 'project_team'
    });
  }, [logActivity]);

  const logTaskAction = useCallback(async (action: string, taskTitle: string, projectId: string, details: string, metadata?: any) => {
    await logActivity({
      action,
      resource: `Task: ${taskTitle}`,
      resourceType: 'task',
      details,
      metadata,
      projectId,
      visibility: 'project_team'
    });
  }, [logActivity]);

  const logFileAction = useCallback(async (action: string, fileName: string, projectId?: string, details?: string, metadata?: any) => {
    await logActivity({
      action,
      resource: `File: ${fileName}`,
      resourceType: 'file',
      details: details || `${action} file ${fileName}`,
      metadata,
      projectId,
      visibility: projectId ? 'project_team' : 'all'
    });
  }, [logActivity]);

  const logSystemAction = useCallback(async (action: string, resource: string, details: string, metadata?: any) => {
    await logActivity({
      action,
      resource,
      resourceType: 'system',
      details,
      metadata,
      visibility: 'management'
    });
  }, [logActivity]);

  const logSecurityAction = useCallback(async (action: string, details: string, metadata?: any) => {
    await logActivity({
      action,
      resource: 'Security Event',
      resourceType: 'auth',
      details,
      metadata,
      visibility: 'management'
    });
  }, [logActivity]);

  const logReportAction = useCallback(async (action: string, reportType: string, details: string, metadata?: any) => {
    await logActivity({
      action,
      resource: `Report: ${reportType}`,
      resourceType: 'report',
      details,
      metadata,
      visibility: 'all'
    });
  }, [logActivity]);

  const logBudgetAction = useCallback(async (action: string, budgetName: string, projectId?: string, details?: string, metadata?: any) => {
    await logActivity({
      action,
      resource: `Budget: ${budgetName}`,
      resourceType: 'budget',
      details: details || `${action} budget ${budgetName}`,
      metadata,
      projectId,
      visibility: 'management'
    });
  }, [logActivity]);

  return {
    logActivity,
    logUserAction,
    logProjectAction,
    logTaskAction,
    logFileAction,
    logSystemAction,
    logSecurityAction,
    logReportAction,
    logBudgetAction
  };
};

export default useActivityLogger;
