import { Router } from 'express';
import { protect as authenticate } from '../middleware/auth.middleware';
import {
    getEmployeeCareer,
    addCareerEvent,
    updateCareerEvent,
    deleteCareerEvent,
    getEventsByType,
    getRecentEvents,
    getCareerStats
} from '../controllers/careerController';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Career history routes
router.get('/:employeeId', getEmployeeCareer);
router.get('/:employeeId/stats', getCareerStats);
router.get('/:employeeId/recent', getRecentEvents);
router.get('/:employeeId/type/:type', getEventsByType);
router.post('/:employeeId/events', addCareerEvent);
router.put('/:employeeId/events/:eventId', updateCareerEvent);
router.delete('/:employeeId/events/:eventId', deleteCareerEvent);

export default router;
