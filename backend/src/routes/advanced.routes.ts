import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import * as filterController from '../controllers/filterController';
import * as reportController from '../controllers/reportScheduleController';

const router = Router();

// Saved Filters
router.get('/filters', authMiddleware, filterController.getSavedFilters);
router.post('/filters', authMiddleware, filterController.createSavedFilter);
router.put('/filters/:id', authMiddleware, filterController.updateSavedFilter);
router.delete('/filters/:id', authMiddleware, filterController.deleteSavedFilter);

// Scheduled Reports
router.get('/scheduled-reports', authMiddleware, reportController.getSchedules);
router.post('/scheduled-reports', authMiddleware, reportController.scheduleReport);
router.put('/scheduled-reports/:id', authMiddleware, reportController.updateSchedule);
router.delete('/scheduled-reports/:id', authMiddleware, reportController.deleteSchedule);

export default router;
