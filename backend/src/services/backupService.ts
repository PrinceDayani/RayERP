import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import { logger } from '../utils/logger';

const execAsync = promisify(exec);

class BackupService {
  private backupDir = process.env.BACKUP_DIR || './backups';

  async createBackup(): Promise<string> {
    try {
      await fs.mkdir(this.backupDir, { recursive: true });
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFileName = `rayerp-backup-${timestamp}.gz`;
      const backupPath = path.join(this.backupDir, backupFileName);
      
      const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/rayerp';
      const dbName = mongoUri.split('/').pop()?.split('?')[0] || 'rayerp';
      
      const command = `mongodump --uri="${mongoUri}" --archive="${backupPath}" --gzip`;
      
      await execAsync(command);
      
      logger.info('Database backup created', { backupPath, size: (await fs.stat(backupPath)).size });
      return backupPath;
    } catch (error) {
      logger.error('Backup creation failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  async restoreBackup(backupPath: string): Promise<void> {
    try {
      const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/rayerp';
      const command = `mongorestore --uri="${mongoUri}" --archive="${backupPath}" --gzip --drop`;
      
      await execAsync(command);
      
      logger.info('Database restored from backup', { backupPath });
    } catch (error) {
      logger.error('Backup restoration failed', { error: error instanceof Error ? error.message : 'Unknown error', backupPath });
      throw error;
    }
  }

  async listBackups(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.backupDir);
      return files.filter(file => file.endsWith('.gz')).sort().reverse();
    } catch (error) {
      logger.error('Failed to list backups', { error: error instanceof Error ? error.message : 'Unknown error' });
      return [];
    }
  }

  async deleteOldBackups(keepDays = 30): Promise<void> {
    try {
      const files = await this.listBackups();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - keepDays);

      for (const file of files) {
        const filePath = path.join(this.backupDir, file);
        const stats = await fs.stat(filePath);
        
        if (stats.mtime < cutoffDate) {
          await fs.unlink(filePath);
          logger.info('Old backup deleted', { file });
        }
      }
    } catch (error) {
      logger.error('Failed to cleanup old backups', { error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  async scheduleBackups(): Promise<void> {
    // Run backup every 24 hours
    setInterval(async () => {
      try {
        await this.createBackup();
        await this.deleteOldBackups();
      } catch (error) {
        logger.error('Scheduled backup failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }, 24 * 60 * 60 * 1000);
    
    logger.info('Backup scheduler started');
  }
}

export default new BackupService();