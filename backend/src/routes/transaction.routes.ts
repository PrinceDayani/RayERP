import express from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import {
  createTransaction,
  getTransactions,
  getTransactionById,
  postTransaction
} from '../controllers/transactionController';

const router = express.Router();

router.use(authenticateToken);

router.post('/', createTransaction);
router.get('/', getTransactions);
router.get('/:id', getTransactionById);
router.put('/:id/post', postTransaction);

export default router;