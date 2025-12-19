import rateLimit from 'express-rate-limit';

// Finance endpoints rate limiter - stricter limits for financial operations
export const financeRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again later.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Skip rate limiting for trusted IPs or internal requests
    skip: (req) => {
        const trustedIPs = process.env.TRUSTED_IPS?.split(',') || [];
        return trustedIPs.includes(req.ip || '');
    }
});

// Stricter rate limiter for write operations (POST, PUT, DELETE)
export const financeWriteRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // Limit write operations more strictly
    message: {
        success: false,
        message: 'Too many write requests, please slow down.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Very strict limiter for posting/approval operations
export const financePostRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 30, // Very limited for critical operations
    message: {
        success: false,
        message: 'Too many posting operations, please wait before retrying.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Report generation rate limiter (can be resource-intensive)
export const reportRateLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 20, // Allow 20 report generations per 5 minutes
    message: {
        success: false,
        message: 'Too many report requests, please wait before generating more reports.',
        retryAfter: '5 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false
});
