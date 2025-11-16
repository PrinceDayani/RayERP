import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

interface CSRFRequest extends Request {
  csrfToken?: string;
  session?: any;
}

// Generate CSRF token
export const generateCSRFToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

// CSRF Protection Middleware
export const csrfProtection = (req: CSRFRequest, res: Response, next: NextFunction) => {
  // Skip CSRF for GET requests and health checks
  if (req.method === 'GET' || req.path === '/api/health') {
    return next();
  }

  // Skip CSRF in development mode for API testing
  if (process.env.NODE_ENV === 'development' && req.headers['x-api-test'] === 'true') {
    return next();
  }

  const token = req.headers['x-csrf-token'] as string || req.body._csrf;
  const sessionToken = req.session?.csrfToken;

  if (!token || !sessionToken || token !== sessionToken) {
    return res.status(403).json({
      success: false,
      message: 'Invalid CSRF token',
      code: 'CSRF_INVALID'
    });
  }

  next();
};

// Middleware to provide CSRF token to client
export const provideCSRFToken = (req: CSRFRequest, res: Response, next: NextFunction) => {
  if (!req.session) {
    req.session = {};
  }

  if (!req.session.csrfToken) {
    req.session.csrfToken = generateCSRFToken();
  }

  req.csrfToken = req.session.csrfToken;
  res.locals.csrfToken = req.session.csrfToken;

  next();
};

// Route to get CSRF token
export const getCSRFToken = (req: CSRFRequest, res: Response) => {
  res.json({
    success: true,
    csrfToken: req.csrfToken || generateCSRFToken()
  });
};