import { Router } from 'express';
import {
  getAllAttendance,
  getAttendanceById,
  checkIn,
  checkOut,
  getAttendanceStats,
  getTodayStats,
  markAttendance,
  updateAttendance,
  deleteAttendance
} from '../controllers/attendanceController';
import { protect } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/rbac.middleware';

const router = Router();

router.use(protect);

router.get('/', requirePermission('view_attendance'), getAllAttendance);
router.get('/stats', requirePermission('view_attendance'), getAttendanceStats);
router.get('/today-stats', requirePermission('view_attendance'), getTodayStats);
router.get('/:id', requirePermission('view_attendance'), getAttendanceById);
router.post('/checkin', requirePermission('manage_attendance'), checkIn);
router.post('/checkout', requirePermission('manage_attendance'), checkOut);
router.post('/mark', requirePermission('manage_attendance'), markAttendance);
router.put('/:id', requirePermission('manage_attendance'), updateAttendance);
router.delete('/:id', requirePermission('manage_attendance'), deleteAttendance);

export default router;