import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import {
  getReportsFeed,
  getReportsMatrix,
  getReportsFeedSummary,
  getReportByIdGlobal,
  updateReportGlobal,
  acknowledgeReportGlobal,
  deleteReportGlobal,
  resolveBlockerGlobal
} from '../controllers/dailyReportController';
import {
  listSchedulesGlobal,
  getScheduleByIdGlobal,
  updateScheduleGlobal,
  deactivateScheduleGlobal
} from '../controllers/reportingScheduleController';

const router = Router();

router.use(authenticateToken);

// Cross-project reporting dashboard endpoints.
// Access scoping is enforced inside each handler via getAccessibleProjectIdsForUser.
router.get('/feed', getReportsFeed);
router.get('/matrix', getReportsMatrix);
router.get('/summary', getReportsFeedSummary);

// Single-report endpoints addressed by report id only.
// Each handler verifies the user can access the report's parent project,
// then delegates to the existing project-scoped controller.
router.get('/reports/:reportId', getReportByIdGlobal);
router.put('/reports/:reportId', updateReportGlobal);
router.patch('/reports/:reportId/acknowledge', acknowledgeReportGlobal);
router.delete('/reports/:reportId', deleteReportGlobal);
router.patch('/reports/:reportId/blockers/:blockerId/resolve', resolveBlockerGlobal);

// Schedules — listed across all accessible projects, addressed by schedule id.
router.get('/schedules', listSchedulesGlobal);
router.get('/schedules/:scheduleId', getScheduleByIdGlobal);
router.put('/schedules/:scheduleId', updateScheduleGlobal);
router.delete('/schedules/:scheduleId', deactivateScheduleGlobal);

export default router;
