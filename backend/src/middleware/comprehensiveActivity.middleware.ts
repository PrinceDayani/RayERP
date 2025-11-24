import { Request, Response, NextFunction } from 'express';
import { logActivity, logUserActivity, logSystemActivity } from '../utils/activityLogger';

interface ActivityConfig {
  action: string;
  resource: string;
  resourceType: 'project' | 'task' | 'file' | 'comment' | 'employee' | 'budget' | 'user' | 'role' | 'department' | 'report' | 'notification' | 'system' | 'auth' | 'other';
  category?: 'system' | 'user' | 'project' | 'security' | 'data';
  severity?: 'low' | 'medium' | 'high' | 'critical';
  getDetails?: (req: Request, res: Response, data?: any) => string;
  getMetadata?: (req: Request, res: Response, data?: any) => any;
}

export const logComprehensiveActivity = (config: ActivityConfig) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Store original res.json to intercept response
    const originalJson = res.json;
    
    res.json = function(body: any) {
      // Determine status based on response
      const status = res.statusCode >= 400 ? 'error' : res.statusCode >= 300 ? 'warning' : 'success';
      
      // Log the activity asynchronously
      setImmediate(async () => {
        try {
          const user = (req as any).user;
          const userId = user?._id?.toString() || user?.id?.toString() || 'system';
          const userName = user?.name || user?.email || 'System';
          
          // Get details and metadata
          const details = config.getDetails ? 
            config.getDetails(req, res, body) : 
            `${config.action} ${config.resource} - ${status}`;
            
          const metadata = config.getMetadata ? 
            config.getMetadata(req, res, body) : 
            { 
              method: req.method,
              url: req.originalUrl,
              statusCode: res.statusCode,
              userAgent: req.get('User-Agent')
            };

          await logActivity({
            userId,
            userName,
            action: config.action as any,
            resource: config.resource,
            resourceType: config.resourceType,
            resourceId: req.params.id || body?.data?._id || body?._id,
            projectId: req.params.projectId || body?.data?.projectId || body?.projectId,
            details,
            metadata: {
              ...metadata,
              timestamp: new Date().toISOString(),
              responseTime: Date.now() - (req as any).startTime
            },
            category: config.category || 'user',
            severity: status === 'error' ? 'high' : config.severity || 'low',
            status: status as any,
            ipAddress: req.ip || req.socket.remoteAddress || 'unknown'
          });
        } catch (error) {
          console.error('Failed to log comprehensive activity:', error);
        }
      });
      
      // Call original json method
      return originalJson.call(this, body);
    };
    
    // Add start time for response time calculation
    (req as any).startTime = Date.now();
    
    next();
  };
};

// Pre-configured middleware for common operations
export const logUserManagement = logComprehensiveActivity({
  action: 'update',
  resource: 'User Management',
  resourceType: 'user',
  category: 'user',
  severity: 'medium',
  getDetails: (req, res, data) => {
    const action = req.method === 'POST' ? 'created' : req.method === 'PUT' ? 'updated' : req.method === 'DELETE' ? 'deleted' : 'accessed';
    return `User ${action} - ${res.statusCode >= 400 ? 'failed' : 'success'}`;
  }
});

export const logFileOperations = logComprehensiveActivity({
  action: 'upload',
  resource: 'File',
  resourceType: 'file',
  category: 'data',
  severity: 'low',
  getDetails: (req, res, data) => {
    const action = req.method === 'POST' ? 'uploaded' : req.method === 'GET' ? 'downloaded' : req.method === 'DELETE' ? 'deleted' : 'accessed';
    const fileName = req.body?.fileName || req.params?.fileName || 'unknown file';
    return `File ${action}: ${fileName}`;
  },
  getMetadata: (req, res, data) => ({
    fileName: req.body?.fileName || req.params?.fileName,
    fileSize: req.body?.fileSize,
    fileType: req.body?.fileType,
    method: req.method
  })
});

export const logSystemOperations = logComprehensiveActivity({
  action: 'update',
  resource: 'System Configuration',
  resourceType: 'system',
  category: 'system',
  severity: 'high',
  getDetails: (req, res, data) => {
    return `System configuration ${req.method === 'POST' ? 'created' : 'updated'} - ${res.statusCode >= 400 ? 'failed' : 'success'}`;
  }
});

export const logReportGeneration = logComprehensiveActivity({
  action: 'create',
  resource: 'Report',
  resourceType: 'report',
  category: 'data',
  severity: 'low',
  getDetails: (req, res, data) => {
    const reportType = req.params?.reportType || req.body?.reportType || 'unknown';
    return `Generated ${reportType} report`;
  },
  getMetadata: (req, res, data) => ({
    reportType: req.params?.reportType || req.body?.reportType,
    filters: req.query,
    generatedAt: new Date().toISOString()
  })
});

export const logBudgetOperations = logComprehensiveActivity({
  action: 'update',
  resource: 'Budget',
  resourceType: 'budget',
  category: 'data',
  severity: 'medium',
  getDetails: (req, res, data) => {
    const action = req.method === 'POST' ? 'created' : req.method === 'PUT' ? 'updated' : req.method === 'DELETE' ? 'deleted' : 'accessed';
    return `Budget ${action} - ${res.statusCode >= 400 ? 'failed' : 'success'}`;
  },
  getMetadata: (req, res, data) => ({
    budgetAmount: req.body?.amount || data?.data?.amount,
    projectId: req.body?.projectId || data?.data?.projectId,
    category: req.body?.category || data?.data?.category
  })
});