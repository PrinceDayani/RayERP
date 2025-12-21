import express from 'express';
import {
  createPayment,
  createInvoice,
  getFinanceById,
  getFinances,
  updateFinance,
  deleteFinance,
  allocatePayment,
  approveFinance,
  markInvoicePaid,
  getFinanceAnalytics,
  getCashFlow,
  getOverdueInvoices,
  getUnallocatedPayments,
  bulkDeleteFinance,
  bulkApproveFinance,
  downloadFinancePDF,
  sendFinanceEmail,
  duplicateInvoice,
} from '../controllers/financeController';
import { getInvoiceAnalytics } from '../controllers/invoiceAnalyticsController';
import { protect } from '../middleware/auth.middleware';

const router = express.Router();

// Apply authentication to all routes
router.use(protect);

// Analytics and reports (must come before /:id)
router.get('/analytics', getFinanceAnalytics);
router.get('/invoices/analytics', getInvoiceAnalytics);
router.get('/cashflow', getCashFlow);
router.get('/overdue', getOverdueInvoices);
router.get('/unallocated', getUnallocatedPayments);

// Bulk operations
router.post('/bulk-delete', bulkDeleteFinance);
router.post('/bulk-approve', bulkApproveFinance);

// Create payment or invoice
router.post('/payments', createPayment);
router.post('/invoices', createInvoice);

// Specialized operations for payments
router.patch('/payments/:id/approve', approveFinance);
router.post('/payments/:id/send', sendFinanceEmail);
router.get('/payments/:id/pdf', downloadFinancePDF);
router.delete('/payments/:id', deleteFinance);

// Specialized operations for invoices
router.patch('/invoices/:id/approve', approveFinance);
router.patch('/invoices/:id/mark-paid', markInvoicePaid);
router.post('/invoices/:id/send', sendFinanceEmail);
router.post('/invoices/:id/duplicate', duplicateInvoice);
router.get('/invoices/:id/pdf', downloadFinancePDF);
router.delete('/invoices/:id', deleteFinance);

// Generic operations
router.post('/allocate', allocatePayment);
router.patch('/:id/approve', approveFinance);
router.get('/:id/pdf', downloadFinancePDF);
router.post('/:id/send-email', sendFinanceEmail);
router.post('/:id/duplicate', duplicateInvoice);

// CRUD operations (must come last)
router.get('/:id', getFinanceById);
router.get('/', getFinances);
router.patch('/:id', updateFinance);
router.delete('/:id', deleteFinance);

export default router;
