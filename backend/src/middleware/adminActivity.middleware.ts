import { Request, Response, NextFunction } from 'express';
import { realTimeAdminEmitter } from '../utils/realTimeAdminEmitter';
import ActivityLog from '../models/ActivityLog';
import { logger } from '../utils/logger';

interface ActivityOptions {
  action?: string;
  resource?: string;
  skipLogging?: boolean;
  skipRealTime?: boolean;
  logLevel?: 'info' | 'warn' | 'error';
}

// Middleware to log admin activities and emit real-time events
export const logAdminActivity = (options: ActivityOptions = {}) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    
    // Store original res.json to intercept response
    const originalJson = res.json;
    let responseData: any = null;
    let statusCode = 200;

    res.json = function(data: any) {
      responseData = data;
      statusCode = res.statusCode;
      return originalJson.call(this, data);
    };

    // Continue with the request
    next();

    // Log activity after response is sent
    res.on('finish', async () => {
      try {
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        const activity = {
          userId: (req as any).user?.id || 'anonymous',
          userName: (req as any).user?.name || (req as any).user?.email || 'Anonymous',
          action: options.action || getActionFromMethod(req.method),
          resource: options.resource || getResourceFromPath(req.path),
          method: req.method,
          path: req.path,
          statusCode,
          duration,
          ipAddress: getClientIP(req),
          userAgent: req.get('User-Agent') || 'unknown',
          timestamp: new Date().toISOString(),
          success: statusCode < 400,
          details: getActivityDetails(req, res, responseData, options)
        };

        // Log to database if not skipped
        if (!options.skipLogging) {
          await logToDatabase(activity);
        }

        // Emit real-time event if not skipped
        if (!options.skipRealTime) {
          emitRealTimeActivity(activity);
        }

        // Log to console based on status
        const logLevel = options.logLevel || (statusCode >= 400 ? 'error' : 'info');
        logger[logLevel](`Admin Activity: ${activity.userName} ${activity.action} ${activity.resource} - ${statusCode} (${duration}ms)`);

      } catch (error) {
        logger.error('Failed to log admin activity:', error);
      }
    });
  };
};

// Specific middleware for different types of admin actions
export const logUserManagement = (action: string) => {
  return logAdminActivity({
    action,
    resource: 'user_management',
    logLevel: action.includes('delete') ? 'warn' : 'info'
  });
};

export const logSystemManagement = (action: string) => {
  return logAdminActivity({
    action,
    resource: 'system_management',
    logLevel: 'warn'
  });
};

export const logSecurityAction = (action: string) => {
  return logAdminActivity({
    action,
    resource: 'security',
    logLevel: 'warn'
  });
};

export const logFinancialAction = (action: string) => {
  return logAdminActivity({
    action,
    resource: 'financial_management',
    logLevel: 'info'
  });
};

export const logDataAccess = (resource: string) => {
  return logAdminActivity({
    action: 'data_access',
    resource,
    logLevel: 'info'
  });
};

// Helper functions
function getActionFromMethod(method: string): string {
  const actionMap: { [key: string]: string } = {
    'GET': 'view',
    'POST': 'create',
    'PUT': 'update',
    'PATCH': 'modify',
    'DELETE': 'delete'
  };
  return actionMap[method.toUpperCase()] || 'unknown';
}

function getResourceFromPath(path: string): string {
  // Extract resource from API path
  const pathParts = path.split('/').filter(part => part && part !== 'api');
  
  if (pathParts.length === 0) return 'unknown';
  
  // Map common paths to resources
  const resourceMap: { [key: string]: string } = {
    'admin': 'admin_panel',
    'users': 'user_management',
    'roles': 'role_management',
    'permissions': 'permission_management',
    'settings': 'system_settings',
    'logs': 'activity_logs',
    'backup': 'system_backup',
    'projects': 'project_management',
    'budgets': 'budget_management',
    'finance': 'financial_management',
    'reports': 'report_management',
    'analytics': 'analytics_access'
  };

  const mainResource = pathParts[0];
  return resourceMap[mainResource] || mainResource;
}

function getClientIP(req: Request): string {
  return (
    req.ip ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    (req.connection as any)?.socket?.remoteAddress ||
    'unknown'
  );
}

function getActivityDetails(
  req: Request, 
  res: Response, 
  responseData: any, 
  options: ActivityOptions
): string {
  const details: string[] = [];
  
  // Add request details
  if (req.params && Object.keys(req.params).length > 0) {
    details.push(`params: ${JSON.stringify(req.params)}`);
  }
  
  if (req.query && Object.keys(req.query).length > 0) {
    details.push(`query: ${JSON.stringify(req.query)}`);
  }
  
  // Add response status
  details.push(`status: ${res.statusCode}`);
  
  // Add error details if applicable
  if (res.statusCode >= 400 && responseData?.error) {
    details.push(`error: ${responseData.error}`);
  }
  
  // Add success details for certain actions
  if (res.statusCode < 400 && responseData) {
    if (responseData.id || responseData._id) {
      details.push(`id: ${responseData.id || responseData._id}`);
    }
    if (responseData.message) {
      details.push(`message: ${responseData.message}`);
    }
  }
  
  return details.join(', ');
}

async function logToDatabase(activity: any) {
  try {
    await ActivityLog.create({
      user: activity.userName,
      userId: activity.userId,
      action: activity.action,
      resource: activity.resource,
      method: activity.method,
      path: activity.path,
      status: activity.success ? 'success' : 'error',
      statusCode: activity.statusCode,
      duration: activity.duration,
      ipAddress: activity.ipAddress,
      userAgent: activity.userAgent,
      details: activity.details,
      timestamp: new Date(activity.timestamp)
    });
  } catch (error) {
    logger.error('Failed to save activity to database:', error);
  }
}

function emitRealTimeActivity(activity: any) {
  try {
    realTimeAdminEmitter.emitUserActivity({
      userId: activity.userId,
      userName: activity.userName,
      action: activity.action,
      resource: activity.resource,
      timestamp: activity.timestamp,
      status: activity.success ? 'success' : 'error',
      ipAddress: activity.ipAddress
    });

    // Emit alerts for critical actions
    if (activity.action === 'delete' && activity.success) {
      realTimeAdminEmitter.emitSystemAlert({
        type: 'user',
        severity: 'medium',
        message: `${activity.userName} deleted ${activity.resource}`
      });
    }

    // Emit security alerts for failed admin actions
    if (!activity.success && activity.statusCode === 403) {
      realTimeAdminEmitter.emitSystemAlert({
        type: 'security',
        severity: 'high',
        message: `Unauthorized admin access attempt by ${activity.userName} on ${activity.resource}`
      });
    }

    // Emit performance alerts for slow requests
    if (activity.duration > 5000) { // 5 seconds
      realTimeAdminEmitter.emitSystemAlert({
        type: 'performance',
        severity: 'medium',
        message: `Slow admin request: ${activity.action} ${activity.resource} took ${activity.duration}ms`
      });
    }

  } catch (error) {
    logger.error('Failed to emit real-time activity:', error);
  }
}

// Middleware to track login/logout events
export const trackAuthEvents = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    const originalJson = res.json;
    
    res.json = function(data: any) {
      // Track successful login
      if (req.path.includes('/login') && res.statusCode === 200 && data.token) {
        realTimeAdminEmitter.emitUserLogin(
          data.user?.id || 'unknown',
          data.user?.name || data.user?.email || 'Unknown',
          getClientIP(req)
        );
      }
      
      // Track failed login
      if (req.path.includes('/login') && res.statusCode >= 400) {
        realTimeAdminEmitter.emitFailedLogin(
          req.body?.email || 'unknown',
          getClientIP(req)
        );
      }
      
      // Track logout
      if (req.path.includes('/logout') && res.statusCode === 200) {
        realTimeAdminEmitter.emitUserLogout(
          (req as any).user?.id || 'unknown',
          (req as any).user?.name || (req as any).user?.email || 'Unknown',
          getClientIP(req)
        );
      }
      
      return originalJson.call(this, data);
    };
    
    next();
  };
};

export default {
  logAdminActivity,
  logUserManagement,
  logSystemManagement,
  logSecurityAction,
  logFinancialAction,
  logDataAccess,
  trackAuthEvents
};