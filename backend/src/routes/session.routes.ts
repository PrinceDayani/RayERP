import { Router } from 'express';
import {
    getActiveSessions,
    revokeSession,
    revokeAllOtherSessions,
    cleanupExpiredSessions,
    getSessionStatistics
} from '../controllers/sessionController';
import { protect } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/rbac.middleware';

const router = Router();

// User session endpoints
router.get('/', protect, getActiveSessions);
router.delete('/:sessionId', protect, revokeSession);
router.delete('/', protect, revokeAllOtherSessions);

// Admin endpoints
router.post('/cleanup', protect, requirePermission('admin.manage_sessions'), cleanupExpiredSessions);
router.get('/statistics', protect, requirePermission('admin.manage_sessions'), getSessionStatistics);

export default router;
