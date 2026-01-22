import cron from 'node-cron';
import UserSession from '../models/UserSession';
import { logger } from '../utils/logger';

/**
 * Session Cleanup Job
 * Runs every hour to delete expired sessions from the database
 */
export const startSessionCleanup = () => {
    // Run cleanup every hour at minute 0
    cron.schedule('0 * * * *', async () => {
        try {
            const count = await UserSession.cleanupExpiredSessions();
            if (count > 0) {
                logger.info(`✅ Session cleanup: Deleted ${count} expired session(s)`);
            }
        } catch (error: any) {
            logger.error(`❌ Session cleanup failed: ${error.message}`);
        }
    });

    logger.info('🕐 Session cleanup cron job started (runs hourly)');
};

/**
 * One-time manual cleanup (useful for system maintenance)
 */
export const runSessionCleanupNow = async () => {
    try {
        const count = await UserSession.cleanupExpiredSessions();
        logger.info(`Manual session cleanup completed: ${count} session(s) deleted`);
        return count;
    } catch (error: any) {
        logger.error(`Manual session cleanup failed: ${error.message}`);
        throw error;
    }
};
