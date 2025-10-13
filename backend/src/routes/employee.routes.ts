import { Router } from 'express';
import {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getEmployeeTasks,
  getEmployeeTaskStats
} from '../controllers/employeeController';
import { protect } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/rbac.middleware';

const router = Router();

router.use(protect);

router.get('/', requirePermission('view_employees'), getAllEmployees);
router.get('/:id', requirePermission('view_employees'), getEmployeeById);
router.post('/', requirePermission('create_employee'), createEmployee);
router.put('/:id', requirePermission('update_employee'), updateEmployee);
router.delete('/:id', requirePermission('delete_employee'), deleteEmployee);
router.get('/:id/tasks', requirePermission('view_employees'), getEmployeeTasks);
router.get('/:id/tasks/stats', requirePermission('view_employees'), getEmployeeTaskStats);

export default router;
