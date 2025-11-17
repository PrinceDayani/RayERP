import express from 'express';
import broadcastController from '../controllers/broadcastController';
import { protect } from '../middleware/auth.middleware';

const router = express.Router();

router.use(protect);

router.post('/send', broadcastController.sendBroadcast);
router.get('/', broadcastController.getBroadcasts);
router.put('/:broadcastId/read', broadcastController.markAsRead);

export default router;
