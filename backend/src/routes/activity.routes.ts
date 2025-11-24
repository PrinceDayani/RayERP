import { Router } from 'express';
import { getBatchActivities, getActivities, createActivity, getActivityById, getActivityStats } from '../controllers/activityController';
import { protect } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/rbac.middleware';

const router = Router();

router.use(protect);

router.post('/', createActivity);
router.get('/batch', getBatchActivities);
router.get('/stats', getActivityStats);
router.get('/:id', getActivityById);
router.get('/', getActivities);

export default router;