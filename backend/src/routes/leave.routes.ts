import { Router } from 'express';
import {
  getAllLeaves,
  createLeave,
  updateLeaveStatus,
  cancelLeave,
  getLeaveBalance
} from '../controllers/leaveController';
import { protect } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/rbac.middleware';
import { requireLeavePermission, requireLeaveManagerPermission } from '../middleware/leavePermission.middleware';

const router = Router();

router.use(protect);

// View permissions - all employees can view leaves
router.get('/', requirePermission('leaves.view'), getAllLeaves);
router.get('/balance/:employeeId', requirePermission('leaves.view'), getLeaveBalance);

// Apply for leave - employees can apply for their own leave only
router.post('/', requireLeavePermission('leaves.apply', true), createLeave);

// Approve leave - only managers can approve leaves
router.put('/:id/status', requireLeaveManagerPermission('leaves.approve'), updateLeaveStatus);

// Cancel leave - only managers can cancel leaves
router.put('/:id/cancel', requireLeaveManagerPermission('leaves.cancel'), cancelLeave);

export default router;