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
  unassignEmployee,
  updateDepartmentPermissions,
  getDepartmentPermissions,
  addDepartmentPermission,
  removeDepartmentPermission,
  getAllEmployeesForDepartment,
  getDepartmentAnalytics,
  getDepartmentProjects,
  getDepartmentNotifications,
  getDepartmentActivityLogs
} from '../controllers/departmentController';
import { protect } from '../middleware/auth.middleware';

const router = express.Router();

router.use(protect);

router.get('/stats', getDepartmentStats);
router.get('/all-employees', getAllEmployeesForDepartment);
router.get('/', getDepartments);
router.get('/:id', getDepartmentById);
router.get('/:id/employees', getDepartmentEmployees);
router.get('/:id/permissions', getDepartmentPermissions);
router.get('/:id/analytics', getDepartmentAnalytics);
router.get('/:id/projects', getDepartmentProjects);
router.get('/:id/notifications', getDepartmentNotifications);
router.get('/:id/activity-logs', getDepartmentActivityLogs);
router.post('/', createDepartment);
router.post('/:id/assign-employees', assignEmployees);
router.post('/:id/permissions/add', addDepartmentPermission);
router.post('/:id/permissions/remove', removeDepartmentPermission);
router.put('/:id', updateDepartment);
router.put('/:id/permissions', updateDepartmentPermissions);
router.delete('/:id', deleteDepartment);
router.delete('/:id/employees/:employeeId', unassignEmployee);
router.patch('/:id/employee-count', updateEmployeeCount);

export default router;
