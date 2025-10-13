import { Request, Response, NextFunction } from 'express';
import ActivityLog from '../models/ActivityLog';

export const logActivity = (action: string, resource: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Store original res.json to intercept response
    const originalJson = res.json;
    
    res.json = function(body: any) {
      // Determine status based on response
      const status = res.statusCode >= 400 ? 'error' : 'success';
      
      // Log the activity asynchronously
      setImmediate(async () => {
        try {
          await ActivityLog.create({
            user: req.user?.name || req.user?.email || 'Unknown',
            action,
            resource,
            status,
            details: `${action} ${resource} - ${status}`,
            ipAddress: req.ip || req.connection.remoteAddress || 'unknown'
          });
        } catch (error) {
          console.error('Failed to log activity:', error);
        }
      });
      
      // Call original json method
      return originalJson.call(this, body);
    };
    
    next();
  };
};