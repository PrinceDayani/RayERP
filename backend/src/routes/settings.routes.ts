import express from 'express';
import { protect } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/permission.middleware';
import { validateCsrfToken } from '../middleware/csrf.middleware';
import { 
  getSettings, 
  updateSettings, 
  switchAccountingMode,
  convertToIndianMode,
  convertToWesternMode
} from '../controllers/settingsController';

const router = express.Router();

router.get('/', protect, requirePermission('settings.view'), getSettings);
router.put('/', protect, requirePermission('settings.edit'), validateCsrfToken, updateSettings);
router.post('/switch-mode', protect, requirePermission('settings.edit'), validateCsrfToken, switchAccountingMode);
router.post('/convert-to-indian', protect, requirePermission('settings.edit'), validateCsrfToken, convertToIndianMode);
router.post('/convert-to-western', protect, requirePermission('settings.edit'), validateCsrfToken, convertToWesternMode);

export default router;
