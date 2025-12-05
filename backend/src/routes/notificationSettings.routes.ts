import express from 'express';
import { protect } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/permission.middleware';
import { 
  getNotificationSettings, 
  updateNotificationSettings,
  getNotificationTemplates,
  updateNotificationTemplate
} from '../controllers/notificationSettingsController';

const router = express.Router();

router.get('/', protect, requirePermission('notifications.manage'), getNotificationSettings);
router.put('/', protect, requirePermission('notifications.manage'), updateNotificationSettings);
router.get('/templates', protect, requirePermission('notifications.manage'), getNotificationTemplates);
router.put('/templates/:id', protect, requirePermission('notifications.manage'), updateNotificationTemplate);

export default router;
