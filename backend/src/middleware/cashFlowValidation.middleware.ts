import { Request, Response, NextFunction } from 'express';
import { validationResult, body, query, param } from 'express-validator';

// Validation middleware
export const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

// Cash flow query validation
export const validateCashFlowQuery = [
  query('startDate').isISO8601().withMessage('Invalid start date format'),
  query('endDate').isISO8601().withMessage('Invalid end date format'),
  query('method').optional().isIn(['direct', 'indirect']).withMessage('Method must be direct or indirect'),
  validate
];

// Category override validation
export const validateCategoryOverride = [
  param('ledgerId').isMongoId().withMessage('Invalid ledger ID'),
  body('category').isIn(['OPERATING', 'INVESTING', 'FINANCING', 'NON_CASH']).withMessage('Invalid category'),
  body('reason').isString().notEmpty().withMessage('Reason is required'),
  validate
];

// Batch update validation
export const validateBatchUpdate = [
  body('ledgerIds').isArray({ min: 1 }).withMessage('ledgerIds must be a non-empty array'),
  body('ledgerIds.*').isMongoId().withMessage('Invalid ledger ID in array'),
  body('category').isIn(['OPERATING', 'INVESTING', 'FINANCING', 'NON_CASH']).withMessage('Invalid category'),
  body('reason').isString().notEmpty().withMessage('Reason is required'),
  validate
];

// Rule validation
export const validateCashFlowRule = [
  body('name').isString().notEmpty().withMessage('Name is required'),
  body('category').isIn(['OPERATING', 'INVESTING', 'FINANCING', 'NON_CASH']).withMessage('Invalid category'),
  body('priority').optional().isInt({ min: 0 }).withMessage('Priority must be a positive integer'),
  body('conditions').isObject().withMessage('Conditions must be an object'),
  validate
];

// Reconciliation validation
export const validateReconciliation = [
  query('startDate').isISO8601().withMessage('Invalid start date format'),
  query('endDate').isISO8601().withMessage('Invalid end date format'),
  validate
];
