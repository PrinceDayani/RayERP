import express from 'express';
import { protect } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/permission.middleware';
import { 
  getSettings, 
  updateSettings, 
  switchAccountingMode,
  convertToIndianMode,
  convertToWesternMode
} from '../controllers/settingsController';

const router = express.Router();

router.get('/', protect, requirePermission('settings.view'), getSettings);
router.put('/', protect, requirePermission('settings.edit'), updateSettings);
router.post('/switch-mode', protect, requirePermission('settings.edit'), switchAccountingMode);
router.post('/convert-to-indian', protect, requirePermission('settings.edit'), convertToIndianMode);
router.post('/convert-to-western', protect, requirePermission('settings.edit'), convertToWesternMode);

export default router;
