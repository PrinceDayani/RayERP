import { Request, Response, NextFunction } from 'express';
import { invalidateDashboardCache } from '../utils/dashboardCache';

// Middleware to invalidate dashboard cache on data mutations
export const invalidateCacheOnMutation = (req: Request, res: Response, next: NextFunction) => {
  const originalJson = res.json.bind(res);
  
  res.json = function(body: any) {
    // Only invalidate on successful mutations
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) && body?.success) {
      invalidateDashboardCache();
    }
    return originalJson(body);
  };
  
  next();
};
