import express from 'express';
import { protect } from '../middleware/auth.middleware';
import { validateRequiredFields } from '../middleware/validation.middleware';
import * as taxController from '../controllers/taxManagement.controller';
const { body, query } = require('express-validator');

const router = express.Router();

// Tax Management Routes

// Get all tax records with filters
router.get('/', protect, taxController.getTaxRecords);

// Get tax liabilities with summary (used by frontend)
router.get('/liabilities', protect, taxController.getTaxLiabilities);

// Get tax statistics
router.get('/stats', protect, taxController.getTaxStats);

// Get GST returns
router.get('/gst-returns', protect, taxController.getGSTReturns);

// Get single tax record by ID
router.get('/:id', protect, taxController.getTaxById);

// Create new tax entry
router.post('/',
  protect,
  [
    body('type').isIn(['GST', 'VAT', 'TDS', 'Income Tax', 'Sales Tax']).withMessage('Invalid tax type'),
    body('amount').isNumeric().withMessage('Amount must be a number'),
    body('rate').isNumeric().withMessage('Rate must be a number'),
    body('period').notEmpty().withMessage('Period is required'),
    body('description').notEmpty().withMessage('Description is required'),
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
    body('rate').optional().isNumeric().withMessage('Rate must be a number')
  ],
  taxController.updateTaxRecord
);

// Delete tax record
router.delete('/:id', protect, taxController.deleteTaxRecord);

// Calculate TDS
router.post('/calculate-tds',
  protect,
  [
    body('amount').isNumeric().withMessage('Amount must be a number'),
    body('rate').isNumeric().withMessage('Rate must be a number')
  ],
  validateRequiredFields(['amount', 'rate']),
  taxController.calculateTDS
);

// Calculate income tax
router.post('/calculate-income-tax',
  protect,
  [
    body('income').isNumeric().withMessage('Income must be a number'),
    body('deductions').optional().isNumeric().withMessage('Deductions must be a number')
  ],
  validateRequiredFields(['income']),
  taxController.calculateIncomeTax
);

export default router;