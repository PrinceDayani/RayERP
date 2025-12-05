import express from 'express';
import { protect } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/permission.middleware';
import { getSystemLogs, exportSystemLogs, clearOldLogs } from '../controllers/systemLogsController';

const router = express.Router();

router.get('/', protect, requirePermission('logs.view'), getSystemLogs);
router.post('/export', protect, requirePermission('logs.export'), exportSystemLogs);
router.delete('/clear', protect, requirePermission('system.manage'), clearOldLogs);

export default router;
