import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/rbac.middleware';
import * as reportController from '../controllers/reportController';

const router = Router();

router.use(protect);

// View reports
router.get('/employees', requirePermission('reports.view'), reportController.getEmployeeReports);
router.get('/projects', requirePermission('reports.view'), reportController.getProjectReports);
router.get('/tasks', requirePermission('reports.view'), reportController.getTaskReports);
router.get('/team-productivity', requirePermission('reports.view'), reportController.getTeamProductivity);
router.get('/overview', requirePermission('reports.view'), reportController.getOverviewStats);

// Create reports (if controller supports)
router.post('/custom', requirePermission('reports.create'), reportController.getOverviewStats);

// Export reports
router.get('/export/:type', requirePermission('reports.export'), reportController.getOverviewStats);

// Schedule reports (if controller supports)
router.post('/schedule', requirePermission('reports.schedule'), reportController.getOverviewStats);

export default router;