import express from 'express';
import { protect } from '../middleware/auth.middleware';
import { validateRequiredFields } from '../middleware/validation.middleware';
import { requirePermission } from '../middleware/permission.middleware';
import { auditLogMiddleware } from '../middleware/auditLog.middleware';
import { strictLimiter } from '../middleware/rateLimiter.middleware';
import * as taxController from '../controllers/taxManagement.controller';
const { body, query } = require('express-validator');

const router = express.Router();

// Apply audit logging to all routes
router.use(auditLogMiddleware);

// Tax Management Routes

// Get all tax records with filters (with pagination)
router.get('/', protect, taxController.getTaxRecords);

// Get tax liabilities with summary
router.get('/liabilities', protect, taxController.getTaxLiabilities);

// Get tax statistics
router.get('/stats', protect, taxController.getTaxStats);

// Get GST returns
router.get('/gst-returns', protect, taxController.getGSTReturns);

// Export tax records
router.get('/export', protect, taxController.exportTaxRecords);

// Get single tax record by ID
router.get('/:id', protect, taxController.getTaxById);

// Create new tax entry
router.post('/',
  protect,
  [
    body('type').isIn(['GST', 'VAT', 'TDS', 'Income Tax', 'Sales Tax']).withMessage('Invalid tax type'),
    body('amount').isNumeric().withMessage('Amount must be a number'),
    body('rate').isNumeric().withMessage('Rate must be a number'),
    body('period').notEmpty().trim().escape().withMessage('Period is required'),
    body('description').notEmpty().trim().escape().withMessage('Description is required'),
    body('dueDate').isISO8601().withMessage('Valid due date is required')
  ],
  validateRequiredFields(['type', 'amount', 'rate', 'period', 'description', 'dueDate']),
  taxController.createTaxRecord
);

// Update tax record
router.put('/:id',
  protect,
  [
    body('status').optional().isIn(['Pending', 'Filed', 'Paid', 'Overdue']).withMessage('Invalid status'),
    body('amount').optional().isNumeric().withMessage('Amount must be a number'),
    body('rate').optional().isNumeric().withMessage('Rate must be a number'),
    body('description').optional().trim().escape()
  ],
  taxController.updateTaxRecord
);

// Soft delete tax record
router.delete('/:id', protect, taxController.softDeleteTaxRecord);

// Calculate TDS (rate limited)
router.post('/calculate-tds',
  protect,
  strictLimiter,
  [
    body('amount').isNumeric().withMessage('Amount must be a number'),
    body('rate').isNumeric().withMessage('Rate must be a number')
  ],
  validateRequiredFields(['amount', 'rate']),
  taxController.calculateTDS
);

// Calculate income tax (rate limited)
router.post('/calculate-income-tax',
  protect,
  strictLimiter,
  [
    body('income').isNumeric().withMessage('Income must be a number'),
    body('deductions').optional().isNumeric().withMessage('Deductions must be a number')
  ],
  validateRequiredFields(['income']),
  taxController.calculateIncomeTax
);

export default router;