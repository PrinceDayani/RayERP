import express from 'express';
import { protect } from '../middleware/auth.middleware';
import {
  createTallyInvoice,
  getTallyInvoices,
  getTallyInvoiceById,
  generateTallyInvoicePDF
} from '../controllers/tallyInvoiceController';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Create new tally invoice
router.post('/', createTallyInvoice);

// Get all tally invoices
router.get('/', getTallyInvoices);

// Get specific tally invoice
router.get('/:id', getTallyInvoiceById);

// Generate PDF for tally invoice
router.get('/:id/pdf', generateTallyInvoicePDF);

export default router;