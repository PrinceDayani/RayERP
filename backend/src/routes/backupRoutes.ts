import express from 'express';
import { 
  createSystemBackup, 
  getBackupLogs, 
  verifyBackup, 
  createBackupSchedule, 
  getBackupSchedules, 
  updateBackupSchedule, 
  deleteBackupSchedule, 
  restoreFromBackup 
} from '../controllers/backupController';
import { authenticateToken } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';

const router = express.Router();

// Create system backup (ROOT/SUPER_ADMIN/ADMIN only)
router.get('/download', authenticateToken, requireRole(['ROOT', 'SUPER_ADMIN', 'ADMIN']), createSystemBackup);

// Backup logs
router.get('/logs', authenticateToken, requireRole(['ROOT', 'SUPER_ADMIN', 'ADMIN']), getBackupLogs);
router.get('/verify/:backupId', authenticateToken, requireRole(['ROOT', 'SUPER_ADMIN', 'ADMIN']), verifyBackup);

// Backup schedules
router.post('/schedules', authenticateToken, requireRole(['ROOT', 'SUPER_ADMIN', 'ADMIN']), createBackupSchedule);
router.get('/schedules', authenticateToken, requireRole(['ROOT', 'SUPER_ADMIN', 'ADMIN']), getBackupSchedules);
router.put('/schedules/:id', authenticateToken, requireRole(['ROOT', 'SUPER_ADMIN', 'ADMIN']), updateBackupSchedule);
router.delete('/schedules/:id', authenticateToken, requireRole(['ROOT', 'SUPER_ADMIN', 'ADMIN']), deleteBackupSchedule);

// Restore functionality
router.post('/restore', authenticateToken, requireRole(['ROOT', 'SUPER_ADMIN']), restoreFromBackup);

export default router;