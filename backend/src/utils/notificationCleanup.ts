import cron from 'node-cron';
import Notification from '../models/Notification';
import { logger } from './logger';

export const initializeNotificationCleanup = () => {
  // Run cleanup every day at 2 AM
  cron.schedule('0 2 * * *', async () => {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Delete read notifications older than 30 days
      const result = await Notification.deleteMany({
        read: true,
        createdAt: { $lt: thirtyDaysAgo }
      });

      logger.info(`Notification cleanup: Deleted ${result.deletedCount} old notifications`);
    } catch (error) {
      logger.error('Notification cleanup error:', error);
    }
  });

  logger.info('✅ Notification cleanup cron job initialized');
};
