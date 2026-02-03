import express from 'express';
import { protect } from '../middleware/auth.middleware';
import { profileUpdateRateLimiter } from '../middleware/rateLimiter.middleware';
import { 
  getNotificationSettings, 
  updateNotificationSettings,
  getNotificationTemplates,
  updateNotificationTemplate
} from '../controllers/notificationSettingsController';

const router = express.Router();

router.get('/', protect, getNotificationSettings);
router.put('/', protect, profileUpdateRateLimiter, updateNotificationSettings);
router.get('/templates', protect, getNotificationTemplates);
router.put('/templates/:id', protect, updateNotificationTemplate);

export default router;
