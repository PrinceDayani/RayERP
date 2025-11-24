import { apiRequest } from './api';

interface ActivityLog {
  action: string;
  resource: string;
  details: string;
  status?: 'success' | 'error' | 'warning';
}

export const logActivity = async (activity: ActivityLog): Promise<void> => {
  try {
    await apiRequest('/api/activities', {
      method: 'POST',
      body: JSON.stringify({
        ...activity,
        status: activity.status || 'success'
      })
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
};
