import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

const csrfTokens = new Map<string, { token: string; expires: number }>();

const CSRF_TOKEN_EXPIRY = 3600000; // 1 hour

// Middleware to provide CSRF token to client
export const provideCsrfToken = (req: Request, res: Response, next: NextFunction) => {
  const userId = (req as any).user?.id || req.ip;
  
  let stored = csrfTokens.get(userId);
  
  // Generate new token if none exists or expired
  if (!stored || stored.expires < Date.now()) {
    const token = crypto.randomBytes(32).toString('hex');
    const expires = Date.now() + CSRF_TOKEN_EXPIRY;
    stored = { token, expires };
    csrfTokens.set(userId, stored);
  }
  
  // Attach token to response locals for access in routes
  res.locals.csrfToken = stored.token;
  next();
};

export const generateCsrfToken = (req: Request, res: Response) => {
  const userId = (req as any).user?.id || req.ip;
  const token = crypto.randomBytes(32).toString('hex');
  const expires = Date.now() + CSRF_TOKEN_EXPIRY;
  
  csrfTokens.set(userId, { token, expires });
  
  // Cleanup expired tokens
  for (const [key, value] of csrfTokens.entries()) {
    if (value.expires < Date.now()) {
      csrfTokens.delete(key);
    }
  }
  
  res.json({ csrfToken: token });
};

export const validateCsrfToken = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers['x-csrf-token'] as string;
  const userId = (req as any).user?.id || req.ip;
  
  if (!token) {
    return res.status(403).json({ success: false, message: 'CSRF token missing' });
  }
  
  const stored = csrfTokens.get(userId);
  
  if (!stored || stored.token !== token || stored.expires < Date.now()) {
    return res.status(403).json({ success: false, message: 'Invalid or expired CSRF token' });
  }
  
  next();
};
