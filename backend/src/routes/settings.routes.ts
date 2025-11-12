// backend/src/routes/settings.routes.ts
import express from 'express';
import { 
  getSettings, 
  updateSetting, 
  bulkUpdateSettings, 
  deleteSetting,
  getAdminSettings,
  updateAdminSettings,
  resetSettings
} from '../controllers/settingsController';
import { protect } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/permission.middleware';
import { 
  validateSettingKey, 
  validateSettingValue, 
  validateSettingScope,
  validateBulkSettings,
  validateAdminSection
} from '../middleware/settings.middleware';

const router = express.Router();

router.use(protect);

// User settings routes
router.get('/', getSettings);
router.put('/', validateSettingKey, validateSettingValue, validateSettingScope, updateSetting);
router.put('/bulk', validateBulkSettings, validateSettingScope, bulkUpdateSettings);
router.post('/reset', validateSettingScope, resetSettings);
router.delete('/:id', deleteSetting);

// Admin settings routes (requires admin permission)
router.get('/admin', requirePermission('system_settings'), getAdminSettings);
router.put('/admin', requirePermission('system_settings'), validateAdminSection, updateAdminSettings);

export default router;