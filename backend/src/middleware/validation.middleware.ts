import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';

const expressValidator = require('express-validator');
const { validationResult, body } = expressValidator;

export const validateRequest = (req: Request, res: Response, next: NextFunction) => {
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

export const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((err: any) => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

export const validateObjectId = (paramName: string = 'id') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const id = req.params[paramName];
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid ID format' });
    }
    next();
  };
};

export const validateRequiredFields = (fields: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const missing = fields.filter(field => !req.body[field]);
    if (missing.length > 0) {
      return res.status(400).json({ success: false, message: `Missing required fields: ${missing.join(', ')}` });
    }
    next();
  };
};

// Finance-specific validations
export const accountValidation = [
  body('name').trim().notEmpty().withMessage('Account name is required'),
  body('code').optional().trim(),
  body('type')
    .isIn(['asset', 'liability', 'equity', 'revenue', 'expense'])
    .withMessage('Invalid account type'),
  body('taxInfo.gstNo')
    .optional()
    .matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/)
    .withMessage('Invalid GST number format'),
  body('taxInfo.panNo')
    .optional()
    .matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)
    .withMessage('Invalid PAN number format'),
  body('bankDetails.ifscCode')
    .optional()
    .matches(/^[A-Z]{4}0[A-Z0-9]{6}$/)
    .withMessage('Invalid IFSC code format'),
];

export const journalEntryValidation = [
  body('date').isISO8601().withMessage('Valid date is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('lines').isArray({ min: 1 }).withMessage('At least one entry line is required'),
];

export const voucherValidation = [
  body('voucherType')
    .isIn(['payment', 'receipt', 'contra', 'sales', 'purchase', 'journal', 'debit_note', 'credit_note'])
    .withMessage('Invalid voucher type'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('narration').trim().notEmpty().withMessage('Narration is required'),
  body('lines').isArray({ min: 1 }).withMessage('At least one transaction line is required'),
];

// Legacy validators
export const validateProjectStatus = (req: Request, res: Response, next: NextFunction) => {
  const validStatuses = ['planning', 'active', 'on-hold', 'completed', 'cancelled'];
  if (req.body.status && !validStatuses.includes(req.body.status)) {
    return res.status(400).json({ success: false, message: 'Invalid project status' });
  }
  next();
};

export const validatePriority = (req: Request, res: Response, next: NextFunction) => {
  const validPriorities = ['low', 'medium', 'high', 'critical'];
  if (req.body.priority && !validPriorities.includes(req.body.priority)) {
    return res.status(400).json({ success: false, message: 'Invalid priority' });
  }
  next();
};

export const validateDateRange = (req: Request, res: Response, next: NextFunction) => {
  if (req.body.startDate && req.body.endDate) {
    const start = new Date(req.body.startDate);
    const end = new Date(req.body.endDate);
    if (start > end) {
      return res.status(400).json({ success: false, message: 'Start date must be before end date' });
    }
  }
  next();
};

export const validateTaskStatus = (req: Request, res: Response, next: NextFunction) => {
  const validStatuses = ['todo', 'in-progress', 'review', 'completed', 'cancelled', 'blocked'];
  if (req.body.status && !validStatuses.includes(req.body.status)) {
    return res.status(400).json({ success: false, message: 'Invalid task status' });
  }
  next();
};

export const validateRecurringEntry = (req: Request, res: Response, next: NextFunction) => next();
export const validateSkipNext = (req: Request, res: Response, next: NextFunction) => next();
export const validateVariables = (req: Request, res: Response, next: NextFunction) => next();
export const validateApprovalConfig = (req: Request, res: Response, next: NextFunction) => next();
export const validateBatchApprove = (req: Request, res: Response, next: NextFunction) => next();
export const validateAccountId = (req: Request, res: Response, next: NextFunction) => next();
export const validateScheduleEmail = (req: Request, res: Response, next: NextFunction) => next();
