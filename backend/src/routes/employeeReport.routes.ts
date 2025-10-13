import { Router } from 'express';
import {
  getEmployeeReport,
  getDepartmentSummary,
  getAttendanceSummary
} from '../controllers/employeeReportController';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.get('/employee-report', getEmployeeReport);
router.get('/department-summary', getDepartmentSummary);
router.get('/attendance-summary', getAttendanceSummary);

export default router;