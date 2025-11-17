import express from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import {
  createPayment,
  getPayments,
  getPaymentById,
  updatePayment
} from '../controllers/simplePaymentController';

const router = express.Router();

router.use(authenticateToken);

router.post('/', createPayment);
router.get('/', getPayments);
router.get('/:id', getPaymentById);
router.put('/:id', updatePayment);

export default router;