import express from 'express';
import { createSystemBackup } from '../controllers/backupController';
import { authenticateToken } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';

const router = express.Router();

// Create system backup (ROOT/SUPER_ADMIN/ADMIN only)
router.get('/download', authenticateToken, requireRole(['ROOT', 'SUPER_ADMIN', 'ADMIN']), createSystemBackup);

export default router;