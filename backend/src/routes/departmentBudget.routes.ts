import express from 'express';
import {
  getDepartmentBudgets,
  getDepartmentBudgetById,
  createDepartmentBudget,
  updateDepartmentBudget,
  deleteDepartmentBudget,
  approveBudget,
  recordExpense,
  getBudgetSummary
} from '../controllers/departmentBudgetController';
import { protect } from '../middleware/auth.middleware';

const router = express.Router();

router.use(protect);

router.get('/', getDepartmentBudgets);
router.get('/:id', getDepartmentBudgetById);
router.get('/department/:departmentId/summary', getBudgetSummary);
router.post('/', createDepartmentBudget);
router.put('/:id', updateDepartmentBudget);
router.put('/:id/approve', approveBudget);
router.put('/:id/expense', recordExpense);
router.delete('/:id', deleteDepartmentBudget);

export default router;
