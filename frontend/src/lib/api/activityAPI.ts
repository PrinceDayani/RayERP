// path: frontend/src/lib/api/activityAPI.ts

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
});

export interface ActivityLog {
  _id: string;
  action: string;
  resource: string;
  details: string;
  user: {
    _id: string;
    name: string;
    email: string;
  };
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
}

export const getActivityLogs = async (filters?: {
  userId?: string;
  action?: string;
  resource?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  page?: number;
}) => {
  try {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }
    
    const response = await fetch(`${API_URL}/api/activity?${params.toString()}`, {
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch activity logs');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch activity logs:', error);
    return { logs: [], totalPages: 1 };
  }
};

export const createActivityLog = async (activityData: {
  action: string;
  resource: string;
  details: string;
}) => {
  const response = await fetch(`${API_URL}/api/activity`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(activityData)
  });
  
  if (!response.ok) throw new Error('Failed to create activity log');
  return response.json();
};

export const getUserActivityLogs = async (userId: string, limit = 50) => {
  const response = await fetch(`${API_URL}/api/activity/user/${userId}?limit=${limit}`, {
    headers: getAuthHeaders()
  });
  
  if (!response.ok) throw new Error('Failed to fetch user activity logs');
  return response.json();
};

export const getActivitySummary = async (period: 'day' | 'week' | 'month' = 'week') => {
  const response = await fetch(`${API_URL}/api/activity/summary?period=${period}`, {
    headers: getAuthHeaders()
  });
  
  if (!response.ok) throw new Error('Failed to fetch activity summary');
  return response.json();
};

const activityAPI = {
  getActivityLogs,
  createActivityLog,
  getUserActivityLogs,
  getActivitySummary
};

export default activityAPI;