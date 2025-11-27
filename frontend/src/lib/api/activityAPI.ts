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
  resourceType: string;
  details: string;
  user: string | { _id: string; name: string; email: string };
  userName: string;
  timestamp: string;
  ipAddress?: string;
  status: 'success' | 'error' | 'warning';
  metadata?: any;
  projectId?: { _id: string; name: string };
  visibility?: string;
  category?: string;
  severity?: string;
}

export interface ActivityStats {
  totalActivities: number;
  todayActivities: number;
  weekActivities: number;
  monthActivities: number;
  resourceTypeStats: { _id: string; count: number }[];
  actionStats: { _id: string; count: number }[];
}

export interface ActivityFilters {
  page?: number;
  limit?: number;
  resourceType?: string;
  projectId?: string;
  startDate?: string;
  endDate?: string;
  action?: string;
  status?: string;
  category?: string;
  severity?: string;
  userName?: string;
}

export const getActivityLogs = async (filters?: ActivityFilters) => {
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
      credentials: 'include',
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

export const getActivityById = async (activityId: string): Promise<{ success: boolean; data: ActivityLog }> => {
  const response = await fetch(`${API_URL}/api/activity/${activityId}`, {
    credentials: 'include',
    headers: getAuthHeaders()
  });
  
  if (!response.ok) throw new Error('Failed to fetch activity details');
  return response.json();
};

export const getActivityStats = async (): Promise<{ success: boolean; data: ActivityStats }> => {
  const response = await fetch(`${API_URL}/api/activity/stats`, {
    credentials: 'include',
    headers: getAuthHeaders()
  });
  
  if (!response.ok) throw new Error('Failed to fetch activity stats');
  return response.json();
};

export const createActivityLog = async (activityData: {
  action: string;
  resource: string;
  resourceType: string;
  details: string;
  metadata?: any;
  projectId?: string;
  visibility?: string;
}) => {
  const response = await fetch(`${API_URL}/api/activity`, {
    method: 'POST',
    credentials: 'include',
    headers: getAuthHeaders(),
    body: JSON.stringify(activityData)
  });
  
  if (!response.ok) throw new Error('Failed to create activity log');
  return response.json();
};

export const getBatchActivities = async (limit = 50) => {
  const response = await fetch(`${API_URL}/api/activity/batch?limit=${limit}`, {
    credentials: 'include',
    headers: getAuthHeaders()
  });
  
  if (!response.ok) throw new Error('Failed to fetch batch activities');
  return response.json();
};

export const getProjectActivity = async (projectId: string, filters?: ActivityFilters) => {
  const params = new URLSearchParams();
  
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value.toString());
      }
    });
  }
  
  const response = await fetch(`${API_URL}/api/projects/${projectId}/activity?${params.toString()}`, {
    credentials: 'include',
    headers: getAuthHeaders()
  });
  
  if (!response.ok) throw new Error('Failed to fetch project activity');
  return response.json();
};

const activityAPI = {
  getActivityLogs,
  getActivityById,
  getActivityStats,
  createActivityLog,
  getBatchActivities,
  getProjectActivity
};

export default activityAPI;
