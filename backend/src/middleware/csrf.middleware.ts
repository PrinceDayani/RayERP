import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

interface CsrfTokenData {
  token: string;
  expires: number;
  deviceFingerprint?: string;
}

const csrfTokens = new Map<string, CsrfTokenData>();

const CSRF_TOKEN_EXPIRY = 3600000; // 1 hour

// Middleware to provide CSRF token to client
export const provideCsrfToken = async (req: Request, res: Response, next: NextFunction) => {
  const userId = (req as any).user?.id || req.ip;
  
  // Get device fingerprint for additional security
  const { generateDeviceFingerprint } = await import('../utils/deviceFingerprint');
  const fingerprint = generateDeviceFingerprint(req as any);
  
  let stored = csrfTokens.get(userId);
  
  // Generate new token if none exists, expired, or device changed
  if (!stored || stored.expires < Date.now() || stored.deviceFingerprint !== fingerprint.hash) {
    const token = crypto.randomBytes(32).toString('hex');
    const expires = Date.now() + CSRF_TOKEN_EXPIRY;
    stored = { token, expires, deviceFingerprint: fingerprint.hash };
    csrfTokens.set(userId, stored);
  }
  
  // Attach token to response locals for access in routes
  res.locals.csrfToken = stored.token;
  next();
};

export const generateCsrfToken = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id || req.ip;
  const token = crypto.randomBytes(32).toString('hex');
  const expires = Date.now() + CSRF_TOKEN_EXPIRY;
  
  // Bind CSRF token to device fingerprint
  const { generateDeviceFingerprint } = await import('../utils/deviceFingerprint');
  const fingerprint = generateDeviceFingerprint(req as any);
  
  csrfTokens.set(userId, { token, expires, deviceFingerprint: fingerprint.hash });
  
  // Cleanup expired tokens
  for (const [key, value] of csrfTokens.entries()) {
    if (value.expires < Date.now()) {
      csrfTokens.delete(key);
    }
  }
  
  res.json({ csrfToken: token });
};

export const validateCsrfToken = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers['x-csrf-token'] as string;
  const userId = (req as any).user?.id || req.ip;
  
  if (!token) {
    return res.status(403).json({ 
      success: false, 
      message: 'CSRF token missing',
      code: 'CSRF_TOKEN_MISSING'
    });
  }
  
  const stored = csrfTokens.get(userId);
  
  if (!stored || stored.expires < Date.now()) {
    return res.status(403).json({ 
      success: false, 
      message: 'CSRF token expired',
      code: 'CSRF_TOKEN_EXPIRED'
    });
  }
  
  if (stored.token !== token) {
    return res.status(403).json({ 
      success: false, 
      message: 'Invalid CSRF token',
      code: 'CSRF_TOKEN_INVALID'
    });
  }
  
  // Validate device fingerprint matches
  const { generateDeviceFingerprint } = await import('../utils/deviceFingerprint');
  const currentFingerprint = generateDeviceFingerprint(req as any);
  
  if (stored.deviceFingerprint && stored.deviceFingerprint !== currentFingerprint.hash) {
    // Device changed, invalidate CSRF token
    csrfTokens.delete(userId);
    
    return res.status(403).json({ 
      success: false, 
      message: 'CSRF token invalid - device mismatch',
      code: 'CSRF_DEVICE_MISMATCH'
    });
  }
  
  next();
};

// Enhanced CSRF protection for state-changing operations
export const validateCsrfForStateChange = async (req: Request, res: Response, next: NextFunction) => {
  // Only validate for state-changing methods
  const stateChangingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
  
  if (!stateChangingMethods.includes(req.method)) {
    return next();
  }
  
  // Validate CSRF token
  return validateCsrfToken(req, res, next);
};
