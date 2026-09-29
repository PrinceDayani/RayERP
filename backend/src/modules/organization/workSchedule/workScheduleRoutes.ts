import { Router } from 'express';
import { protect } from '../../../middleware/auth.middleware';
import { requirePermission } from '../../../middleware/rbac.middleware';
import { validateCsrfToken } from '../../../middleware/csrf.middleware';
import {
  listSchedules,
  getEmployeeRules,
  createSchedule,
  updateSchedule,
  saveGeneralTimings,
  deleteSchedule,
  getAssignments,
  setAssignments
} from './workScheduleController';

const router = Router();

router.use(protect);

// General timings and shifts; readable by everyone.
router.get('/', listSchedules);

// Timings in force for one employee.
router.get('/employee/:employeeId', getEmployeeRules);

// Save the organisation's general timings.
router.put('/general', requirePermission('organization.manage'), validateCsrfToken, saveGeneralTimings);

// Create, update and delete named shifts.
router.post('/', requirePermission('organization.manage'), validateCsrfToken, createSchedule);
router.put('/:id', requirePermission('organization.manage'), validateCsrfToken, updateSchedule);
router.delete('/:id', requirePermission('organization.manage'), validateCsrfToken, deleteSchedule);

// Departments and employees following a shift.
router.get('/:id/assignments', requirePermission('organization.view'), getAssignments);
router.put('/:id/assignments', requirePermission('organization.manage'), validateCsrfToken, setAssignments);

export default router;
