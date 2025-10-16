import express from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import {
  createPayment,
  getPayments,
  getPaymentById,
  updatePaymentStatus
} from '../controllers/paymentController';

const router = express.Router();

router.use(authenticateToken);

router.post('/', createPayment);
router.get('/', getPayments);
router.get('/:id', getPaymentById);
router.put('/:id/status', updatePaymentStatus);

export default router;