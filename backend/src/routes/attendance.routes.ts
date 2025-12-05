import { Router } from 'express';
import {
  getAllAttendance,
  getAttendanceById,
  checkIn,
  checkOut,
  getAttendanceStats,
  getTodayStats,
  requestAttendance,
  approveAttendance,
  syncCardData,
  updateAttendance,
  deleteAttendance
} from '../controllers/attendanceController';
import { protect } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/rbac.middleware';
import { requireAttendancePermission, requireManagerPermission } from '../middleware/attendancePermission.middleware';

const router = Router();

router.use(protect);

// View permissions - all employees can view attendance
router.get('/', requirePermission('attendance.view'), getAllAttendance);
router.get('/stats', requirePermission('attendance.view'), getAttendanceStats);
router.get('/today-stats', requirePermission('attendance.view'), getTodayStats);
router.get('/:id', requirePermission('attendance.view'), getAttendanceById);

// Mark/Request attendance - employees can request attendance (needs approval)
router.post('/mark', requireAttendancePermission('attendance.mark', true), requestAttendance);
router.post('/request', requireAttendancePermission('attendance.mark', true), requestAttendance);
router.post('/checkin', requireAttendancePermission('attendance.mark', true), checkIn);
router.post('/checkout', requireAttendancePermission('attendance.mark', true), checkOut);

// Approve attendance requests - only managers
router.put('/:id/approve', requireManagerPermission('attendance.edit'), approveAttendance);

// Card system integration - system level access
router.post('/card-sync', syncCardData);

// Edit attendance - only managers can edit any attendance records
router.put('/:id', requireManagerPermission('attendance.edit'), updateAttendance);
router.delete('/:id', requireManagerPermission('attendance.edit'), deleteAttendance);

export default router;