import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';
import { UserRole } from '../models/User';
import * as reportController from '../controllers/reportController';

const router = Router();

// Get employee reports
router.get(
  '/employees',
  protect,
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.ROOT),
  reportController.getEmployeeReports
);

// Get project reports
router.get(
  '/projects',
  protect,
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.ROOT),
  reportController.getProjectReports
);

// Get task reports
router.get(
  '/tasks',
  protect,
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.ROOT),
  reportController.getTaskReports
);

// Get team productivity
router.get(
  '/team-productivity',
  protect,
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.ROOT),
  reportController.getTeamProductivity
);

export default router;