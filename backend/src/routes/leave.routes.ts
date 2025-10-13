import { Router } from 'express';
import {
  getAllLeaves,
  createLeave,
  updateLeaveStatus,
  getLeaveBalance
} from '../controllers/leaveController';
import { protect } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/rbac.middleware';

const router = Router();

router.use(protect);

router.get('/', requirePermission('view_leaves'), getAllLeaves);
router.post('/', requirePermission('create_leave'), createLeave);
router.put('/:id/status', requirePermission('manage_leaves'), updateLeaveStatus);
router.get('/balance/:employeeId', requirePermission('view_leaves'), getLeaveBalance);

export default router;