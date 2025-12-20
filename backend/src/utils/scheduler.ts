import cron from 'node-cron';
import { runScheduledReports } from '../controllers/reportScheduleController';
import { logger } from '../utils/logger';

export const initializeScheduler = () => {
  // Run every hour
  cron.schedule('0 * * * *', async () => {
    logger.info('Running scheduled reports check...');
    try {
      await runScheduledReports();
    } catch (error) {
      logger.error('Scheduled reports error:', error);
    }
  });

  logger.info('Report scheduler initialized');
};
