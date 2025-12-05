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
import { requirePermission } from '../middleware/permission.middleware';

const router = express.Router();

// Create system backup
router.get('/download', authenticateToken, requirePermission('backups.create'), createSystemBackup);

// Backup logs
router.get('/logs', authenticateToken, requirePermission('backups.view'), getBackupLogs);
router.get('/verify/:backupId', authenticateToken, requirePermission('backups.view'), verifyBackup);

// Backup schedules
router.post('/schedules', authenticateToken, requirePermission('backups.manage'), createBackupSchedule);
router.get('/schedules', authenticateToken, requirePermission('backups.view'), getBackupSchedules);
router.put('/schedules/:id', authenticateToken, requirePermission('backups.manage'), updateBackupSchedule);
router.delete('/schedules/:id', authenticateToken, requirePermission('backups.manage'), deleteBackupSchedule);

// Restore functionality
router.post('/restore', authenticateToken, requirePermission('backups.restore'), restoreFromBackup);

export default router;