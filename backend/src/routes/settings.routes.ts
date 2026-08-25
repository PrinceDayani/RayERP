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
import { getMyPreferences, updateMyPreferences } from '../controllers/userPreferenceController';

const router = express.Router();

// Personal preferences for the signed-in user. Authentication only: these are
// the caller's own settings, not organisation configuration, so they must not
// sit behind the settings.view / settings.edit administrative permissions.
// Declared before '/' so the literal path is not shadowed.
router.get('/me', protect, getMyPreferences);
router.put('/me', protect, validateCsrfToken, updateMyPreferences);

// Organisation-wide settings.
router.get('/', protect, requirePermission('settings.view'), getSettings);
router.put('/', protect, requirePermission('settings.edit'), validateCsrfToken, updateSettings);
router.post('/switch-mode', protect, requirePermission('settings.edit'), validateCsrfToken, switchAccountingMode);
router.post('/convert-to-indian', protect, requirePermission('settings.edit'), validateCsrfToken, convertToIndianMode);
router.post('/convert-to-western', protect, requirePermission('settings.edit'), validateCsrfToken, convertToWesternMode);

export default router;
