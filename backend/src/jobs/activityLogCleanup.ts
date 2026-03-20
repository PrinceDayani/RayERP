import cron from 'node-cron';
import ActivityLog from '../models/ActivityLog';
import { logger } from '../utils/logger';

const RETENTION_DAYS = 90; // Keep activity logs for 90 days

export const startActivityLogCleanup = () => {
  // Run cleanup daily at 3 AM
  cron.schedule('0 3 * * *', async () => {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS);

      const result = await ActivityLog.deleteMany({
        timestamp: { $lt: cutoffDate }
      });

      if (result.deletedCount > 0) {
        logger.info(`✅ Activity log cleanup: Deleted ${result.deletedCount} old record(s)`);
      }
    } catch (error: any) {
      logger.error(`❌ Activity log cleanup failed: ${error.message}`);
    }
  });

  logger.info(`🕐 Activity log cleanup started (runs daily, ${RETENTION_DAYS}-day retention)`);
};

export const runActivityLogCleanupNow = async () => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS);

    const result = await ActivityLog.deleteMany({
      timestamp: { $lt: cutoffDate }
    });

    logger.info(`Manual activity log cleanup: ${result.deletedCount} record(s) deleted`);
    return result.deletedCount;
  } catch (error: any) {
    logger.error(`Manual activity log cleanup failed: ${error.message}`);
    throw error;
  }
};
