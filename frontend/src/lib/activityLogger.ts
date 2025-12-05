import { apiClient } from './api';

interface ActivityLog {
  action: string;
  resource: string;
  details: string;
  status?: 'success' | 'error' | 'warning';
}

export const logActivity = async (activity: ActivityLog): Promise<void> => {
  try {
    await apiClient.post('/api/activities', {
      ...activity,
      status: activity.status || 'success'
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
};
