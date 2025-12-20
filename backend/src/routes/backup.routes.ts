import express from 'express';
import { protect } from '../middleware/auth.middleware';
import backupService from '../services/backupService';
import { logger } from '../utils/logger';

const router = express.Router();

router.use(protect);

// Create backup
router.post('/create', async (req, res) => {
  try {
    const backupPath = await backupService.createBackup();
    res.json({ 
      success: true, 
      message: 'Backup created successfully',
      backupPath 
    });
  } catch (error: any) {
    logger.error('Backup creation failed', { error: error.message });
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// List backups
router.get('/list', async (req, res) => {
  try {
    const backups = await backupService.listBackups();
    res.json({ 
      success: true, 
      data: backups 
    });
  } catch (error: any) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Restore backup
router.post('/restore', async (req, res) => {
  try {
    const { backupPath } = req.body;
    if (!backupPath) {
      return res.status(400).json({ 
        success: false, 
        message: 'Backup path is required' 
      });
    }
    
    await backupService.restoreBackup(backupPath);
    res.json({ 
      success: true, 
      message: 'Database restored successfully' 
    });
  } catch (error: any) {
    logger.error('Backup restoration failed', { error: error.message });
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

export default router;