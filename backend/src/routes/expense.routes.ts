import express from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import {
  createExpense,
  getExpenses,
  getExpenseById,
  approveExpense,
  getExpenseCategories
} from '../controllers/expenseController';

const router = express.Router();

router.use(authenticateToken);

router.post('/', createExpense);
router.get('/', getExpenses);
router.get('/categories', getExpenseCategories);
router.get('/:id', getExpenseById);
router.put('/:id/approve', approveExpense);

export default router;