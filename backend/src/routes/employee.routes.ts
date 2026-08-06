import { Router } from 'express';
import {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getEmployeeTasks,
  getEmployeeTaskStats,
  getEmployeeFilterOptions
} from '../controllers/employeeController';
import { protect } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/rbac.middleware';

const router = Router();

router.use(protect);

router.get('/', requirePermission('employees.view'), getAllEmployees);
// Distinct work locations / project postings / employment categories for filters
router.get('/filter-options', requirePermission('employees.view'), getEmployeeFilterOptions);
router.get('/:id', requirePermission('employees.view'), getEmployeeById);
router.post('/', requirePermission('employees.create'), createEmployee);
router.put('/:id', requirePermission('employees.edit'), updateEmployee);
router.delete('/:id', requirePermission('employees.delete'), deleteEmployee);
router.get('/:id/tasks', requirePermission('employees.view'), getEmployeeTasks);
router.get('/:id/tasks/stats', requirePermission('employees.view'), getEmployeeTaskStats);

export default router;
