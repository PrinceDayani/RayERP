import rateLimit from 'express-rate-limit';

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: 10 * 1000, // 10 seconds
  max: 50, // 50 requests per 10 seconds
  message: { success: false, message: 'Too many requests, please try again in 10 seconds' },
  standardHeaders: true,
  legacyHeaders: false,
});

// General rate limiter for all cash flow endpoints
export const cashFlowLimiter = rateLimit({
  windowMs: 10 * 1000, // 10 seconds
  max: 50, // 50 requests per 10 seconds
  message: { success: false, message: 'Too many requests, please try again in 10 seconds' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter limiter for write operations
export const cashFlowWriteLimiter = rateLimit({
  windowMs: 10 * 1000, // 10 seconds
  max: 20, // 20 write operations per 10 seconds
  message: { success: false, message: 'Too many write operations, please try again in 10 seconds' },
});

// Very strict for batch operations
export const batchOperationLimiter = rateLimit({
  windowMs: 10 * 1000, // 10 seconds
  max: 5, // 5 batch operations per 10 seconds
  message: { success: false, message: 'Too many batch operations, please try again in 10 seconds' },
});

// Strict limiter for sensitive operations
export const strictLimiter = rateLimit({
  windowMs: 10 * 1000, // 10 seconds
  max: 15, // 15 requests per 10 seconds
  message: { success: false, message: 'Too many requests, please try again in 10 seconds' },
});

// Forecast operations limiter
export const forecastLimiter = rateLimit({
  windowMs: 10 * 1000, // 10 seconds
  max: 10, // 10 forecast requests per 10 seconds
  message: { success: false, message: 'Too many forecast requests, please try again in 10 seconds' },
});

// Variance operations limiter
export const varianceLimiter = rateLimit({
  windowMs: 10 * 1000, // 10 seconds
  max: 10, // 10 variance requests per 10 seconds
  message: { success: false, message: 'Too many variance requests, please try again in 10 seconds' },
});
