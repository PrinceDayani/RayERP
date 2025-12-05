import { Router } from 'express';
import { 
  getEmployeeSalary, 
  updateEmployeeSalary,
  getEmployeeSalaryHistory 
} from '../controllers/salaryController';
import { protect } from '../middleware/auth.middleware';
import { canViewSalary, canEditSalary } from '../middleware/salaryPermission.middleware';

const router = Router();

// All routes require authentication
router.use(protect);

// Get employee salary - requires view permission
router.get('/:id', canViewSalary, getEmployeeSalary);

// Update employee salary - requires edit permission
router.put('/:id', canEditSalary, updateEmployeeSalary);

// Get salary history - requires view permission
router.get('/:id/history', canViewSalary, getEmployeeSalaryHistory);

export default router;
