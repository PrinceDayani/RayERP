const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL;

if (!API_BASE_URL) {
  console.error('API URL not configured. Please set NEXT_PUBLIC_API_URL in your environment.');
}

export class ApiError extends Error {
  constructor(public status: number, message: string, public data?: any) {
    super(message);
    this.name = 'ApiError';
  }
}

export const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  try {
    const token = localStorage.getItem('auth-token');
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const message = errorData.error || errorData.message || `HTTP error! status: ${response.status}`;
      throw new ApiError(response.status, message, errorData);
    }
    
    return response.json();
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Server connection failed. Please check if the backend is running.');
    }
    throw error;
  }
};

export const analyticsApi = {
  async checkAuth() {
    return apiRequest('/api/auth/check');
  },
  async getDashboardAnalytics() {
    return apiRequest('/api/analytics/dashboard');
  },
  async getEmployeeMetrics() {
    return {
      total: 150,
      active: 142,
      onLeave: 8,
      newHires: 12
    };
  },
  async getProjectMetrics() {
    return {
      total: 25,
      active: 18,
      completed: 7,
      overdue: 3
    };
  },
  async getTaskMetrics() {
    return {
      total: 340,
      completed: 280,
      inProgress: 45,
      pending: 15
    };
  }
};

export const api = {
  async get(endpoint: string, options?: { params?: any }) {
    const url = new URL(`${API_BASE_URL}/api${endpoint}`);
    if (options?.params) {
      Object.entries(options.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }
    const token = localStorage.getItem('auth-token');
    const response = await fetch(url.toString(), {
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('API Error:', { status: response.status, endpoint, error: errorData });
      throw new ApiError(response.status, errorData.message || `HTTP error! status: ${response.status}`, errorData);
    }
    return response.json();
  },

  async post(endpoint: string, data?: any) {
    const token = localStorage.getItem('auth-token');
    const response = await fetch(`${API_BASE_URL}/api${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: data ? JSON.stringify(data) : undefined,
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('API Error:', { status: response.status, endpoint, error: errorData });
      throw new ApiError(response.status, errorData.message || `HTTP error! status: ${response.status}`, errorData);
    }
    return response.json();
  },

  async put(endpoint: string, data: any) {
    const token = localStorage.getItem('auth-token');
    const response = await fetch(`${API_BASE_URL}/api${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('API Error:', { status: response.status, endpoint, error: errorData });
      throw new ApiError(response.status, errorData.message || `HTTP error! status: ${response.status}`, errorData);
    }
    return response.json();
  },

  async delete(endpoint: string) {
    const token = localStorage.getItem('auth-token');
    const response = await fetch(`${API_BASE_URL}/api${endpoint}`, {
      method: 'DELETE',
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('API Error:', { status: response.status, endpoint, error: errorData });
      throw new ApiError(response.status, errorData.message || `HTTP error! status: ${response.status}`, errorData);
    }
    return response.json();
  }
};

export const employeesAPI = {
  async getEmployee(id: string) {
    return apiRequest(`/api/employees/${id}`);
  },
  async updateEmployee(id: string, data: any) {
    return apiRequest(`/api/employees/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }
};

// Default export for backward compatibility
export default api;