import { Router } from 'express';
import { getBatchActivities, getActivities, createActivity } from '../controllers/activityController';
import { protect } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/rbac.middleware';

const router = Router();

router.use(protect);

router.post('/', createActivity);
router.get('/batch', requirePermission('view_activities'), getBatchActivities);
router.get('/', requirePermission('view_activities'), getActivities);

export default router;