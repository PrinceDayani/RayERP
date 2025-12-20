/**
 * Rate Limiting Middleware for Financial Reports
 */

import rateLimit from 'express-rate-limit';
import { RateLimitError } from '../utils/reportErrors';
import { logger } from '../utils/logger';

// Standard rate limiter for report generation
export const reportRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many report requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      user: (req as any).user?.id
    });
    
    res.status(429).json({
      success: false,
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: res.getHeader('Retry-After')
    });
  },
  skip: (req) => {
    // Skip rate limiting for admin users
    return (req as any).user?.role === 'admin';
  }
});

// Strict rate limiter for export operations
export const exportRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 exports per hour
  message: 'Too many export requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Export rate limit exceeded', {
      ip: req.ip,
      format: req.query.format,
      user: (req as any).user?.id
    });
    
    res.status(429).json({
      success: false,
      error: 'Export limit exceeded',
      message: 'You have exceeded the export limit. Please try again in an hour.',
      retryAfter: res.getHeader('Retry-After')
    });
  }
});

// Cache clear rate limiter (very strict)
export const cacheRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 cache clears per hour
  message: 'Too many cache clear requests',
  standardHeaders: true,
  legacyHeaders: false
});
