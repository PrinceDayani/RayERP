// backend/src/routes/settings.routes.ts
import express from 'express';
import { getSettings, updateSetting, bulkUpdateSettings, deleteSetting } from '../controllers/settingsController';
import { protect } from '../middleware/auth.middleware';

const router = express.Router();

// Apply authentication middleware to all settings routes
router.use(protect);

// Get settings
router.get('/', getSettings);

// Update a single setting
router.put('/', updateSetting);

// Bulk update settings
router.put('/bulk', bulkUpdateSettings);

// Delete a setting
router.delete('/:id', deleteSetting);

export default router;