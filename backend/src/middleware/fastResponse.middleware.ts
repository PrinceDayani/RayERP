import { Request, Response, NextFunction } from 'express';

// Ultra-fast response middleware
const fastResponse = (req: Request, res: Response, next: NextFunction) => {
  // Skip heavy middleware for health checks
  if (req.path === '/api/health') {
    return res.json({ status: 'ok', timestamp: Date.now() });
  }

  // Set aggressive caching headers for static content
  if (req.path.includes('/uploads/') || req.path.includes('/static/')) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  }

  // Compress responses
  res.setHeader('Content-Encoding', 'gzip');
  
  next();
};

module.exports = { fastResponse };
export { fastResponse };