import rateLimit from 'express-rate-limit';

// Profile & Upload Rate Limiters (NEW)
export const uploadRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many upload requests. Please try again in 15 minutes.', code: 'UPLOAD_RATE_LIMIT_EXCEEDED' },
  standardHeaders: true,
  legacyHeaders: false
});

export const deleteRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many deletion requests. Please try again in 15 minutes.', code: 'DELETE_RATE_LIMIT_EXCEEDED' },
  standardHeaders: true,
  legacyHeaders: false
});

export const profileUpdateRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { success: false, message: 'Too many profile update requests. Please try again in 15 minutes.', code: 'PROFILE_UPDATE_RATE_LIMIT_EXCEEDED' },
  standardHeaders: true,
  legacyHeaders: false
});

// Existing Rate Limiters (RESTORED)
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

export const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

export const forecastLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many forecast requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

export const varianceLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: 'Too many variance requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

export const cashFlowLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many cash flow requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

export const cashFlowWriteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { error: 'Too many cash flow write requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

export const batchOperationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many batch operations, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});
