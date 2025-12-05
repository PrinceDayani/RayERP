import express from 'express';
import { authenticateToken as authenticate } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/budgetAuth';
import { strictLimiter } from '../middleware/rateLimiter.middleware';
const { body, param } = require('express-validator');
import { validateRequest } from '../middleware/validation.middleware';
import {
  createTransferRequest,
  approveTransfer,
  rejectTransfer,
  getAllTransfers,
  getTransferById,
  getPendingTransfers,
  getBudgetTransferHistory
} from '../controllers/budgetTransferController';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Create transfer request (requires allocate permission)
router.post('/',
  strictLimiter,
  body('fromBudgetId').isMongoId().withMessage('Invalid from budget ID'),
  body('toBudgetId').isMongoId().withMessage('Invalid to budget ID'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be positive'),
  body('reason').notEmpty().withMessage('Reason is required'),
  validateRequest,
  requirePermission('budgets.allocate'),
  createTransferRequest
);

// Approve transfer (requires approve permission)
router.post('/:transferId/approve',
  strictLimiter,
  param('transferId').isMongoId().withMessage('Invalid transfer ID'),
  validateRequest,
  requirePermission('budgets.approve'),
  approveTransfer
);

// Reject transfer (requires approve permission)
router.post('/:transferId/reject',
  param('transferId').isMongoId().withMessage('Invalid transfer ID'),
  body('rejectionReason').notEmpty().withMessage('Rejection reason is required'),
  validateRequest,
  requirePermission('budgets.approve'),
  rejectTransfer
);

// Get all transfers (requires view permission)
router.get('/', requirePermission('budgets.view'), getAllTransfers);

// Get pending transfers (requires approve permission)
router.get('/pending', requirePermission('budgets.approve'), getPendingTransfers);

// Get transfer by ID (requires view permission)
router.get('/:transferId', requirePermission('budgets.view'), getTransferById);

// Get transfer history for a budget (requires view permission)
router.get('/budget/:budgetId/history', requirePermission('budgets.view'), getBudgetTransferHistory);

export default router;
