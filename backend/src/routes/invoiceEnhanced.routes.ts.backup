import express from 'express';
import * as invoiceEnhanced from '../controllers/invoiceEnhancedController';
import { protect } from '../middleware/auth.middleware';

const router = express.Router();

router.use(protect);

// Recurring Invoices
router.post('/recurring/generate', invoiceEnhanced.generateRecurringInvoices);

// Partial Payments
router.post('/:id/payments', invoiceEnhanced.addPayment);

// Aging Report
router.get('/reports/aging', invoiceEnhanced.getAgingReport);

// Voucher Integration
router.post('/:id/create-voucher', invoiceEnhanced.createVoucherFromInvoice);

// E-Invoice
router.post('/:id/e-invoice', invoiceEnhanced.generateEInvoice);

// Proforma Conversion
router.post('/:id/convert-to-invoice', invoiceEnhanced.convertProformaToInvoice);

// Email Automation
router.post('/:id/email', invoiceEnhanced.emailInvoice);
router.post('/:id/reminder', invoiceEnhanced.sendReminder);

// Disputes
router.post('/:id/dispute', invoiceEnhanced.disputeInvoice);

// Approval
router.post('/:id/approve', invoiceEnhanced.approveInvoice);

export default router;
