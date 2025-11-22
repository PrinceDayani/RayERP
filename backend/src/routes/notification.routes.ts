import { Router } from 'express';
import { protect as auth } from '../middleware/auth.middleware';
import * as notificationController from '../controllers/notificationController';

const router = Router();

router.get('/', auth, notificationController.getUserNotifications);
router.get('/unread-count', auth, notificationController.getUnreadCount);
router.post('/test', auth, notificationController.sendTestNotification);
router.patch('/:id/read', auth, notificationController.markAsRead);
router.patch('/mark-all-read', auth, notificationController.markAllAsRead);
router.delete('/:id', auth, notificationController.deleteNotification);
router.delete('/', auth, notificationController.deleteAllNotifications);

export default router;
