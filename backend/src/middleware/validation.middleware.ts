import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';

// Generic validation result handler
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Journal Entry Validation Rules
export const validateJournalEntry = [
  body('entryDate').isISO8601().withMessage('Valid entry date is required'),
  body('description').trim().isLength({ min: 1, max: 500 }).withMessage('Description must be 1-500 characters'),
  body('lines').isArray({ min: 2 }).withMessage('At least 2 journal lines are required'),
  body('lines.*.account').isMongoId().withMessage('Valid account ID is required'),
  body('lines.*.debit').isNumeric().withMessage('Debit must be a number'),
  body('lines.*.credit').isNumeric().withMessage('Credit must be a number'),
  body('lines.*.description').trim().isLength({ min: 1, max: 200 }).withMessage('Line description is required'),
  handleValidationErrors
];

// ID Parameter Validation
export const validateMongoId = (paramName: string = 'id') => [
  param(paramName).isMongoId().withMessage(`Valid ${paramName} is required`),
  handleValidationErrors
];

// Date Range Validation
export const validateDateRange = [
  query('fromDate').optional().isISO8601().withMessage('Valid from date is required'),
  query('toDate').optional().isISO8601().withMessage('Valid to date is required'),
  handleValidationErrors
];

// File Upload Validation
export const validateFileUpload = (req: Request, res: Response, next: NextFunction) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'File is required'
    });
  }

  // Check file size (10MB limit)
  if (req.file.size > 10 * 1024 * 1024) {
    return res.status(400).json({
      success: false,
      message: 'File size must be less than 10MB'
    });
  }

  // Check file type
  const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf', 'text/csv'];
  if (!allowedTypes.includes(req.file.mimetype)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid file type. Only JPEG, PNG, PDF, and CSV files are allowed'
    });
  }

  next();
};

// Sanitize input to prevent XSS
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  const sanitizeString = (str: string): string => {
    return str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
              .replace(/javascript:/gi, '')
              .replace(/on\w+\s*=/gi, '');
  };

  const sanitizeObject = (obj: any): any => {
    if (typeof obj === 'string') {
      return sanitizeString(obj);
    } else if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    } else if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const key in obj) {
        sanitized[key] = sanitizeObject(obj[key]);
      }
      return sanitized;
    }
    return obj;
  };

  req.body = sanitizeObject(req.body);
  req.query = sanitizeObject(req.query);
  req.params = sanitizeObject(req.params);

  next();
};

// Rate limiting for sensitive operations
export const rateLimitSensitive = (req: Request, res: Response, next: NextFunction) => {
  // This would typically use a rate limiting library like express-rate-limit
  // For now, we'll just add a simple check
  const userAgent = req.get('User-Agent') || '';
  if (userAgent.includes('bot') || userAgent.includes('crawler')) {
    return res.status(429).json({
      success: false,
      message: 'Too many requests'
    });
  }
  next();
};

// Additional validation functions
export const validateObjectId = (paramName: string = 'id') => [
  param(paramName).isMongoId().withMessage(`Valid ${paramName} is required`),
  handleValidationErrors
];

export const validateRequiredFields = (fields: string[]) => [
  ...fields.map(field => 
    body(field).notEmpty().withMessage(`${field} is required`)
  ),
  handleValidationErrors
];

export const validateProjectStatus = [
  body('status').isIn(['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED'])
    .withMessage('Valid status is required'),
  handleValidationErrors
];

export const validateTaskStatus = [
  body('status').isIn(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'CANCELLED'])
    .withMessage('Valid task status is required'),
  handleValidationErrors
];

export const validatePriority = [
  body('priority').isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
    .withMessage('Valid priority is required'),
  handleValidationErrors
];