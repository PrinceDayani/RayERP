import express from 'express';
import { protect } from '../middleware/auth.middleware';
import { requireFinanceAccess } from '../middleware/financePermission.middleware';
import {
  createReceipt,
  getReceipts,
  getReceiptById,
  getReceiptsByInvoice,
  cancelReceipt,
  getReceiptStats,
  validateReceiptCreation
} from '../controllers/receiptController';
import { invoiceRateLimit } from '../controllers/invoiceController';

const router = express.Router();

// Apply authentication and rate limiting
router.use(protect);
router.use(invoiceRateLimit);

// Receipt routes
router.post('/', validateReceiptCreation, requireFinanceAccess('invoices.edit'), createReceipt);
router.get('/', requireFinanceAccess('invoices.view'), getReceipts);
router.get('/stats', requireFinanceAccess('invoices.view'), getReceiptStats);
router.get('/invoice/:invoiceId', requireFinanceAccess('invoices.view'), getReceiptsByInvoice);
router.get('/:id', requireFinanceAccess('invoices.view'), getReceiptById);
router.post('/:id/cancel', requireFinanceAccess('invoices.edit'), cancelReceipt);

export default router;
