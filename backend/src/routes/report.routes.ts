import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';
import * as reportController from '../controllers/reportController';

const router = Router();

// Get employee reports
router.get(
  '/employees',
  protect,
  authorize('Admin', 'Superadmin', 'Root'),
  reportController.getEmployeeReports
);

// Get project reports
router.get(
  '/projects',
  protect,
  authorize('Admin', 'Superadmin', 'Root'),
  reportController.getProjectReports
);

// Get task reports
router.get(
  '/tasks',
  protect,
  authorize('Admin', 'Superadmin', 'Root'),
  reportController.getTaskReports
);

// Get team productivity
router.get(
  '/team-productivity',
  protect,
  authorize('Admin', 'Superadmin', 'Root'),
  reportController.getTeamProductivity
);

export default router;