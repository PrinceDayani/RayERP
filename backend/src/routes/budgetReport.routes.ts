import express from 'express';
import { authenticateToken as authenticate } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/budgetAuth';
const { body, param } = require('express-validator');
import { validateRequest } from '../middleware/validation.middleware';
import {
  generateReport,
  getAllReports,
  getReportById,
  downloadReport,
  deleteReport,
  generateVarianceReport,
  generateComparisonReport,
  getReportStatistics
} from '../controllers/budgetReportController';

const router = express.Router();

router.use(authenticate);

// Generate report (requires view permission)
router.post('/generate',
  body('reportName').notEmpty().withMessage('Report name is required'),
  body('reportType').isIn(['summary', 'detailed', 'variance', 'forecast', 'comparison', 'custom']),
  body('format').isIn(['pdf', 'excel', 'csv', 'json']),
  validateRequest,
  requirePermission('budgets.view'),
  generateReport
);

// Get all reports (requires view permission)
router.get('/',
  requirePermission('budgets.view'),
  getAllReports
);

// Get report statistics (requires view permission)
router.get('/statistics',
  requirePermission('budgets.view'),
  getReportStatistics
);

// Get report by ID (requires view permission)
router.get('/:reportId',
  param('reportId').isMongoId().withMessage('Invalid report ID'),
  validateRequest,
  requirePermission('budgets.view'),
  getReportById
);

// Download report (requires view permission)
router.get('/:reportId/download',
  param('reportId').isMongoId().withMessage('Invalid report ID'),
  validateRequest,
  requirePermission('budgets.view'),
  downloadReport
);

// Delete report (requires view permission)
router.delete('/:reportId',
  param('reportId').isMongoId().withMessage('Invalid report ID'),
  validateRequest,
  requirePermission('budgets.view'),
  deleteReport
);

// Generate variance report (requires view permission)
router.post('/variance',
  body('budgetIds').isArray().withMessage('Budget IDs must be an array'),
  validateRequest,
  requirePermission('budgets.view'),
  generateVarianceReport
);

// Generate comparison report (requires view permission)
router.post('/comparison',
  body('fiscalYears').isArray().withMessage('Fiscal years must be an array'),
  validateRequest,
  requirePermission('budgets.view'),
  generateComparisonReport
);

export default router;
