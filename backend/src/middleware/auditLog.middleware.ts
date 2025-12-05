import { Request, Response, NextFunction } from 'express';
import AuditLog from '../models/AuditLog';

const getClientIp = (req: Request): string => {
  return (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || 
         req.socket.remoteAddress || 
         'unknown';
};

const getActionFromMethod = (method: string): 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW' => {
  switch (method) {
    case 'POST': return 'CREATE';
    case 'PUT':
    case 'PATCH': return 'UPDATE';
    case 'DELETE': return 'DELETE';
    default: return 'VIEW';
  }
};

const getModuleFromPath = (path: string): string => {
  const parts = path.split('/').filter(Boolean);
  if (parts.length > 1) {
    return parts[1].toUpperCase().replace(/-/g, '_');
  }
  return 'SYSTEM';
};

export const auditLogMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  // Skip audit logging for certain paths
  const skipPaths = ['/api/health', '/api/audit-trail', '/uploads', '/socket.io'];
  if (skipPaths.some(path => req.path.startsWith(path))) {
    return next();
  }

  // Skip GET requests (only log mutations)
  if (req.method === 'GET') {
    return next();
  }

  // Only log if user is authenticated
  if (!req.user) {
    return next();
  }

  // Store original send function
  const originalSend = res.send;
  let responseBody: any;

  // Override send to capture response
  res.send = function (body: any): Response {
    responseBody = body;
    return originalSend.call(this, body);
  };

  // Wait for response to complete
  res.on('finish', async () => {
    try {
      const action = getActionFromMethod(req.method);
      const module = getModuleFromPath(req.path);
      
      let status: 'Success' | 'Failed' = 'Success';
      if (res.statusCode >= 400) {
        status = 'Failed';
      }

      await AuditLog.create({
        userId: req.user._id,
        userEmail: req.user.email,
        action,
        module,
        recordId: req.params.id || req.body?.id || undefined,
        ipAddress: getClientIp(req),
        userAgent: (req.get('User-Agent') || 'unknown').substring(0, 500),
        status,
        additionalData: {
          path: req.path,
          method: req.method,
          statusCode: res.statusCode
        }
      });
    } catch (error) {
      console.error('Error creating audit log:', error);
    }
  });

  next();
};
