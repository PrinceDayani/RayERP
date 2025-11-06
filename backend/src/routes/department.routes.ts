import express from 'express';
import {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getDepartmentStats,
  updateEmployeeCount,
  getDepartmentEmployees,
  assignEmployees,
  unassignEmployee
} from '../controllers/departmentController';
import { protect } from '../middleware/auth.middleware';

const router = express.Router();

router.use(protect);

router.get('/stats', getDepartmentStats);
router.get('/', getDepartments);
router.get('/:id', getDepartmentById);
router.get('/:id/employees', getDepartmentEmployees);
router.post('/', createDepartment);
router.post('/:id/assign-employees', assignEmployees);
router.put('/:id', updateDepartment);
router.delete('/:id', deleteDepartment);
router.delete('/:id/employees/:employeeId', unassignEmployee);
router.patch('/:id/employee-count', updateEmployeeCount);

export default router;
