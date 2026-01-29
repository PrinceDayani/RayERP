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
  getDepartmentActivityLogs,
  getDepartmentBudgetHistory,
  getDepartmentExpenses,
  getDepartmentPerformanceMetrics,
  getDepartmentGoals,
  getDepartmentResourceUtilization,
  getDepartmentComplianceStatus,
  adjustDepartmentBudget,
  bulkDeleteDepartments,
  bulkUpdateDepartments,
  exportDepartments
} from '../controllers/departmentController';
import { protect } from '../middleware/auth.middleware';
import { requirePermission, requireAnyPermission } from '../middleware/rbac.middleware';

const router = express.Router();

// All routes require authentication
router.use(protect);

// ==================== VIEW ROUTES ====================
// Department List & Stats (departments.view)
router.get('/stats', requirePermission('departments.view'), getDepartmentStats);
router.get('/', requirePermission('departments.view'), getDepartments);

// Department Details (departments.details)
router.get('/:id', requirePermission('departments.details'), getDepartmentById);
router.get('/:id/analytics', requirePermission('departments.details'), getDepartmentAnalytics);
router.get('/:id/notifications', requirePermission('departments.details'), getDepartmentNotifications);
router.get('/:id/activity-logs', requireAnyPermission(['departments.view_history', 'departments.details']), getDepartmentActivityLogs);

// ==================== MEMBER ROUTES ====================
// View Members (departments.view_members)
router.get('/:id/employees', requirePermission('departments.view_members'), getDepartmentEmployees);
router.get('/all-employees', requirePermission('departments.view_members'), getAllEmployeesForDepartment);
router.get('/:id/projects', requirePermission('departments.view_members'), getDepartmentProjects);

// Assign/Unassign Members (departments.assign_members)
router.post('/:id/assign-employees', requirePermission('departments.assign_members'), assignEmployees);
router.delete('/:id/employees/:employeeId', requirePermission('departments.assign_members'), unassignEmployee);

// ==================== BUDGET ROUTES ====================
// View Budget (departments.view_budget)
router.get('/:id/budget-history', requirePermission('departments.view_budget'), getDepartmentBudgetHistory);

// View Expenses (departments.view_expenses)
router.get('/:id/expenses', requirePermission('departments.view_expenses'), getDepartmentExpenses);

// Adjust Budget (departments.adjust_budget)
router.post('/:id/adjust-budget', requirePermission('departments.adjust_budget'), adjustDepartmentBudget);

// ==================== PERFORMANCE & REPORTS ====================
// View Performance (departments.view_performance)
router.get('/:id/performance-metrics', requirePermission('departments.view_performance'), getDepartmentPerformanceMetrics);
router.get('/:id/resource-utilization', requirePermission('departments.view_performance'), getDepartmentResourceUtilization);

// View Goals (departments.view_goals)
router.get('/:id/goals', requirePermission('departments.view_goals'), getDepartmentGoals);

// Compliance Status
router.get('/:id/compliance-status', requireAnyPermission(['departments.view_settings', 'departments.details']), getDepartmentComplianceStatus);

// ==================== MANAGEMENT ROUTES ====================
// Create Department (departments.create)
router.post('/', requirePermission('departments.create'), createDepartment);

// Bulk Operations
router.post('/bulk/delete', requirePermission('departments.delete'), bulkDeleteDepartments);
router.post('/bulk/update', requirePermission('departments.edit'), bulkUpdateDepartments);

// Export
router.get('/export', requirePermission('departments.view'), exportDepartments);

// Edit Department (departments.edit)
router.put('/:id', requirePermission('departments.edit'), updateDepartment);
router.patch('/:id/employee-count', requirePermission('departments.edit'), updateEmployeeCount);

// Delete Department (departments.delete)
router.delete('/:id', requirePermission('departments.delete'), deleteDepartment);

// ==================== PERMISSION ROUTES ====================
// View Settings/Permissions (departments.view_settings)
router.get('/:id/permissions', requirePermission('departments.view_settings'), getDepartmentPermissions);

// Manage Permissions (departments.manage_permissions)
router.post('/:id/permissions/add', requirePermission('departments.manage_permissions'), addDepartmentPermission);
router.post('/:id/permissions/remove', requirePermission('departments.manage_permissions'), removeDepartmentPermission);
router.put('/:id/permissions', requirePermission('departments.manage_permissions'), updateDepartmentPermissions);

export default router;
