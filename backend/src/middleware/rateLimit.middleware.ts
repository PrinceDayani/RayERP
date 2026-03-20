import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/express';
import { incrementCounter } from '../utils/redis';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
}

const defaultConfig: RateLimitConfig = {
  windowMs: 60000, // 1 minute
  maxRequests: 100,
  message: 'Too many requests, please try again later'
};

export const createRateLimiter = (config: Partial<RateLimitConfig> = {}) => {
  const finalConfig = { ...defaultConfig, ...config };
  const windowSeconds = Math.floor(finalConfig.windowMs / 1000);

  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      if (!user) {
        return next();
      }

      const key = `ratelimit:${user.id}:${req.path}`;
      const count = await incrementCounter(key, windowSeconds);

      res.setHeader('X-RateLimit-Limit', finalConfig.maxRequests);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, finalConfig.maxRequests - count));
      res.setHeader('X-RateLimit-Reset', new Date(Date.now() + finalConfig.windowMs).toISOString());

      if (count > finalConfig.maxRequests) {
        console.warn(`[Rate Limit] User ${user.name} exceeded limit on ${req.path}`, {
          count,
          limit: finalConfig.maxRequests,
          ip: req.ip
        });

        return res.status(429).json({
          success: false,
          message: finalConfig.message,
          retryAfter: windowSeconds
        });
      }

      next();
    } catch (error) {
      console.error('[Rate Limit] Error:', error);
      next();
    }
  };
};

// Preset rate limiters
export const activityRateLimit = createRateLimiter({
  windowMs: 60000, // 1 minute
  maxRequests: 100,
  message: 'Too many activity requests. Please wait before trying again.'
});

export const searchRateLimit = createRateLimiter({
  windowMs: 60000, // 1 minute
  maxRequests: 30,
  message: 'Too many search requests. Please wait before searching again.'
});

export const exportRateLimit = createRateLimiter({
  windowMs: 300000, // 5 minutes
  maxRequests: 5,
  message: 'Too many export requests. Please wait before exporting again.'
});
