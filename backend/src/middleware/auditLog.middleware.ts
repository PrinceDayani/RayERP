import { Request, Response, NextFunction } from 'express';
import AuditLog from '../models/AuditLog';
import {
  calculateRiskLevel,
  maskSensitiveData,
  generateLogHash,
  getLastLogHash,
  checkFailedLoginAttempts,
  getGeolocation
} from '../utils/auditUtils';

const getClientIp = (req: Request): string => {
  return (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || 
         req.socket.remoteAddress || 
         'unknown';
};

export const auditLog = (action: string, module: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const originalJson = res.json.bind(res);
    const startTime = Date.now();

    res.json = function (body: any) {
      const responseTime = Date.now() - startTime;
      const status = res.statusCode >= 200 && res.statusCode < 300 ? 'Success' : 'Failed';
      
      // Log asynchronously to not block response
      setImmediate(async () => {
        try {
          if (!req.user) return;

          const ipAddress = getClientIp(req);
          const timestamp = new Date();
          const riskLevel = calculateRiskLevel(action, module, status, timestamp);
          const geolocation = await getGeolocation(ipAddress);
          
          // Check for failed login attempts
          if (action === 'LOGIN' && status === 'Failed') {
            const { shouldAlert } = await checkFailedLoginAttempts(AuditLog, req.user.email, ipAddress);
            if (shouldAlert) {
              console.warn(`🚨 SECURITY ALERT: Multiple failed login attempts for ${req.user.email} from ${ipAddress}`);
              // TODO: Send email/SMS alert to admin
            }
          }

          const previousHash = await getLastLogHash(AuditLog);
          const currentHash = generateLogHash(timestamp, req.user._id.toString(), action, module, previousHash);

          await AuditLog.create({
            userId: req.user._id,
            userEmail: req.user.email,
            action,
            module,
            recordId: req.params.id || req.body._id,
            oldValue: maskSensitiveData(JSON.stringify(req.body.oldValue || '')),
            newValue: maskSensitiveData(JSON.stringify(req.body.newValue || req.body)),
            ipAddress,
            userAgent: (req.get('User-Agent') || 'unknown').substring(0, 500),
            status,
            riskLevel,
            geolocation,
            previousHash,
            currentHash,
            sessionId: req.headers['x-session-id'] as string,
            additionalData: {
              responseTime,
              statusCode: res.statusCode,
              method: req.method,
              path: req.path
            }
          });
        } catch (error) {
          console.error('Audit logging error:', error);
        }
      });

      return originalJson(body);
    };

    next();
  };
};
