import { Router } from 'express';
import { getBatchActivities, getActivities, createActivity, getActivityById, getActivityStats, exportActivities, revertActivity, searchActivities, verifyActivity, verifyChain } from '../controllers/activityController';
import { protect } from '../middleware/auth.middleware';
import { requirePermission, requireAnyPermission } from '../middleware/rbac.middleware';
import { activityRateLimit, searchRateLimit, exportRateLimit } from '../middleware/rateLimit.middleware';

const router = Router();

router.use(protect);

router.post('/', activityRateLimit as any, createActivity as any);
router.post('/:id/revert', requireAnyPermission(['activities.revert', 'activities.view_all']) as any, revertActivity as any);
router.get('/verify-chain', requireAnyPermission(['activities.view_all']) as any, verifyChain as any);
router.get('/search', searchRateLimit as any, requireAnyPermission(['activities.view', 'audit.view']) as any, searchActivities as any);
router.get('/export', exportRateLimit as any, requireAnyPermission(['activities.view', 'audit.view']) as any, exportActivities as any);
router.get('/batch', activityRateLimit as any, requireAnyPermission(['activities.view', 'audit.view']) as any, getBatchActivities as any);
router.get('/stats', activityRateLimit as any, requireAnyPermission(['activities.view', 'audit.view']) as any, getActivityStats as any);
router.get('/:id/verify', requireAnyPermission(['activities.view_all']) as any, verifyActivity as any);
router.get('/:id', activityRateLimit as any, requireAnyPermission(['activities.view', 'audit.view']) as any, getActivityById as any);
router.get('/', activityRateLimit as any, requireAnyPermission(['activities.view', 'audit.view']) as any, getActivities as any);

export default router;