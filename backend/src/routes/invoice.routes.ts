import express from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import {
  createInvoice,
  getInvoices,
  getInvoiceById,
  updateInvoice,
  markInvoicePaid
} from '../controllers/invoiceController';

const router = express.Router();

router.use(authenticateToken);

router.post('/', createInvoice);
router.get('/', getInvoices);
router.get('/:id', getInvoiceById);
router.put('/:id', updateInvoice);
router.put('/:id/pay', markInvoicePaid);

export default router;