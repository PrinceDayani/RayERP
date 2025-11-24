import api from './api';

export interface BackupOptions {
  backupType: 'database' | 'files' | 'full' | 'incremental';
  modules?: string[];
  storageLocation: 'local' | 'cloud' | 'external';
  cloudProvider?: string;
  encrypt?: boolean;
}

export interface BackupSchedule {
  name: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string;
  dayOfWeek?: number;
  dayOfMonth?: number;
  backupType: 'database' | 'files' | 'full' | 'incremental';
  modules: string[];
  storageLocation: 'local' | 'cloud';
  cloudProvider?: string;
  isEncrypted: boolean;
}

export interface BackupLog {
  _id: string;
  backupId: string;
  type: 'manual' | 'scheduled';
  backupType: string;
  status: 'pending' | 'in-progress' | 'success' | 'failed';
  size: number;
  duration: number;
  startTime: string;
  endTime: string;
  isEncrypted: boolean;
  isHealthy: boolean;
  modules: string[];
  errorMessage?: string;
}

// Advanced backup creation
export const createAdvancedBackup = async (options: BackupOptions): Promise<Blob> => {
  const params = new URLSearchParams();
  params.append('backupType', options.backupType);
  params.append('storageLocation', options.storageLocation);
  
  if (options.modules && options.modules.length > 0) {
    params.append('modules', options.modules.join(','));
  }
  
  if (options.encrypt) {
    params.append('encrypt', 'true');
  }
  
  if (options.cloudProvider) {
    params.append('cloudProvider', options.cloudProvider);
  }

  const response = await api.get(`/backup/download?${params.toString()}`, {
    responseType: 'blob',
    timeout: 600000 // 10 minutes timeout
  });
  
  return response.data;
};

// Backup schedules
export const createBackupSchedule = async (schedule: BackupSchedule) => {
  const response = await api.post('/backup/schedules', schedule);
  return response.data;
};

export const getBackupSchedules = async () => {
  const response = await api.get('/backup/schedules');
  return response.data;
};

export const deleteBackupSchedule = async (id: string) => {
  const response = await api.delete(`/backup/schedules/${id}`);
  return response.data;
};

// Backup logs
export const getBackupLogs = async (page = 1, limit = 10) => {
  const response = await api.get(`/backup/logs?page=${page}&limit=${limit}`);
  return response.data;
};

// Backup verification
export const verifyBackupIntegrity = async (backupId: string) => {
  const response = await api.get(`/backup/verify/${backupId}`);
  return response.data;
};

// Restore backup (placeholder for future implementation)
export const restoreBackup = async (backupId: string, options: any) => {
  // This would be implemented when restore functionality is added
  throw new Error('Restore functionality not yet implemented');
};

export const advancedBackupAPI = {
  createAdvancedBackup,
  createBackupSchedule,
  getBackupSchedules,
  deleteBackupSchedule,
  getBackupLogs,
  verifyBackupIntegrity,
  restoreBackup
};

export default advancedBackupAPI;
