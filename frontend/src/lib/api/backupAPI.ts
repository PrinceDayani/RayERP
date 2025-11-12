import api from './api';

export const downloadSystemBackup = async (): Promise<Blob> => {
  const response = await api.get('/backup/download', {
    responseType: 'blob',
    timeout: 300000 // 5 minutes timeout for large backups
  });
  return response.data;
};

export const backupAPI = {
  downloadSystemBackup
};

export default backupAPI;