const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';
const DEFAULT_TIMEOUT = 30000;

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface RequestOptions extends RequestInit {
  timeout?: number;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { timeout = DEFAULT_TIMEOUT, ...fetchOptions } = options;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...fetchOptions.headers,
      },
      signal: controller.signal,
      ...fetchOptions,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      if (response.status === 401) {
        throw new ApiError('Authentication required', 401, 'UNAUTHORIZED');
      }
      
      if (response.status === 403) {
        throw new ApiError('Access denied', 403, 'FORBIDDEN');
      }
      
      if (response.status >= 500) {
        throw new ApiError('Server error', response.status, 'SERVER_ERROR');
      }
      
      throw new ApiError(
        `Request failed: ${response.statusText}`,
        response.status,
        'REQUEST_FAILED'
      );
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof ApiError) {
      throw error;
    }
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new ApiError('Request timeout', 408, 'TIMEOUT');
      }
      
      throw new ApiError(`Network error: ${error.message}`, 0, 'NETWORK_ERROR');
    }
    
    throw new ApiError('Unknown error occurred', 0, 'UNKNOWN_ERROR');
  }
}

export interface DashboardStats {
  employeeMetrics: {
    total: number;
    active: number;
    attendanceToday: number;
  };
  projectMetrics: {
    total: number;
    active: number;
    completed: number;
  };
  taskMetrics: {
    total: number;
    completed: number;
    pending: number;
  };
}

export interface RecentActivity {
  id: string;
  type: 'employee' | 'project' | 'task' | 'attendance';
  title: string;
  description: string;
  timestamp: string;
  icon: string;
}

export const dashboardAPI = {
  getDashboardStats: async (): Promise<{ success: boolean; data: DashboardStats }> => {
    return apiRequest('/api/analytics/dashboard');
  },

  getRecentActivities: async (): Promise<{ success: boolean; data: RecentActivity[] }> => {
    return apiRequest('/api/activity/recent?limit=10');
  },

  getEmployeeStats: async (): Promise<{ success: boolean; data: any }> => {
    return apiRequest('/api/employees/stats');
  },

  getProjectStats: async (): Promise<{ success: boolean; data: any }> => {
    return apiRequest('/api/projects/stats');
  },

  getTaskStats: async (): Promise<{ success: boolean; data: any }> => {
    return apiRequest('/api/tasks/stats');
  }
};

export default dashboardAPI;