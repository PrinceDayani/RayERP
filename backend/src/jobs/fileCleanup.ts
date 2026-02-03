import cron from 'node-cron';
import fs from 'fs';
import path from 'path';
import Employee from '../models/Employee';
import { logger } from '../utils/logger';

/**
 * File Cleanup Job - Removes orphaned files
 * Runs daily at 2 AM
 */
export const startFileCleanup = () => {
  cron.schedule('0 2 * * *', async () => {
    logger.info('🧹 Starting file cleanup job');
    
    try {
      const uploadsDir = path.join(__dirname, '../../public/uploads');
      
      if (!fs.existsSync(uploadsDir)) {
        logger.warn('Uploads directory does not exist');
        return;
      }

      // Get all files in uploads directory
      const files = fs.readdirSync(uploadsDir);
      
      // Get all document URLs from database
      const employees = await Employee.find({ documents: { $exists: true, $ne: [] } })
        .select('documents avatarUrl')
        .lean();
      
      const usedFiles = new Set<string>();
      
      // Collect all used files
      employees.forEach(emp => {
        // Add avatar files
        if ((emp as any).avatarUrl) {
          const filename = path.basename((emp as any).avatarUrl);
          usedFiles.add(filename);
        }
        
        // Add document files
        if ((emp as any).documents) {
          (emp as any).documents.forEach((doc: any) => {
            const filename = path.basename(doc.url);
            usedFiles.add(filename);
          });
        }
      });
      
      // Delete orphaned files
      let deletedCount = 0;
      files.forEach(file => {
        if (!usedFiles.has(file)) {
          const filePath = path.join(uploadsDir, file);
          try {
            fs.unlinkSync(filePath);
            deletedCount++;
            logger.debug(`Deleted orphaned file: ${file}`);
          } catch (err) {
            logger.error(`Failed to delete file ${file}:`, err);
          }
        }
      });
      
      logger.info(`✅ File cleanup completed. Deleted ${deletedCount} orphaned files`);
    } catch (error: any) {
      logger.error('File cleanup job failed:', error.message);
    }
  });
  
  logger.info('✅ File cleanup cron job started (daily at 2 AM)');
};
