import express from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import {
  createInvoice,
  getInvoices,
  getInvoiceById,
  updateInvoice,
  deleteInvoice
} from '../controllers/simpleInvoiceController';

const router = express.Router();

router.use(authenticateToken);

router.post('/', createInvoice);
router.get('/', getInvoices);
router.get('/:id', getInvoiceById);
router.put('/:id', updateInvoice);
router.delete('/:id', deleteInvoice);

export default router;