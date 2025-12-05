import cron from 'node-cron';
import AuditLog from '../models/AuditLog';
import { logger } from './logger';

const RETENTION_DAYS = 2555; // 7 years

export const cleanupOldAuditLogs = async () => {
  try {
    const cutoffDate = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);
    const result = await AuditLog.deleteMany({ timestamp: { $lt: cutoffDate } });
    
    if (result.deletedCount > 0) {
      logger.info(`🗑️ Cleaned up ${result.deletedCount} old audit logs (older than ${RETENTION_DAYS} days)`);
    }
  } catch (error) {
    logger.error('❌ Error cleaning up audit logs:', error);
  }
};

export const initializeAuditLogCleanup = () => {
  // Run cleanup every Sunday at 2 AM
  cron.schedule('0 2 * * 0', async () => {
    logger.info('🔄 Starting scheduled audit log cleanup...');
    await cleanupOldAuditLogs();
  });

  logger.info('✅ Audit log cleanup scheduler initialized (runs weekly)');
};
