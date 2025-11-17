// path: frontend/src/lib/analyticsAPI.ts
import api from './api';

export class ApiError extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.code = code;
  }
}

// Check authentication
export const checkAuth = async () => {
  try {
    const response = await api.get('/auth/me');
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 401) {
      throw new ApiError('Unauthorized', 'UNAUTHORIZED');
    }
    if (error.code === 'ECONNABORTED') {
      throw new ApiError('Request timeout', 'TIMEOUT');
    }
    if (error.message === 'Network Error') {
      throw new ApiError('Network error', 'NETWORK_ERROR');
    }
    throw new ApiError('Authentication check failed', 'UNKNOWN');
  }
};

// Get dashboard analytics data
export const getDashboardAnalytics = async () => {
  try {
    const response = await api.get('/analytics/dashboard');
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 401) {
      throw new ApiError('Unauthorized', 'UNAUTHORIZED');
    }
    if (error.code === 'ECONNABORTED') {
      throw new ApiError('Request timeout', 'TIMEOUT');
    }
    if (error.message === 'Network Error') {
      throw new ApiError('Network error', 'NETWORK_ERROR');
    }
    throw error;
  }
};

// Get sales analytics data
export const getSalesAnalytics = async () => {
  try {
    const response = await api.get('/analytics/sales');
    return response.data;
  } catch (error) {
    console.error('Error fetching sales analytics:', error);
    throw error;
  }
};

// Get inventory analytics data
export const getInventoryAnalytics = async () => {
  try {
    const response = await api.get('/analytics/inventory');
    return response.data;
  } catch (error) {
    console.error('Error fetching inventory analytics:', error);
    throw error;
  }
};

// Get productivity trends
export const getProductivityTrends = async (period = '30d', department = 'all') => {
  try {
    const response = await api.get(`/analytics/productivity-trends?period=${period}&department=${department}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching productivity trends:', error);
    throw error;
  }
};

// Get project dues
export const getProjectDues = async () => {
  try {
    const response = await api.get('/analytics/project-dues');
    return response.data;
  } catch (error) {
    console.error('Error fetching project dues:', error);
    throw error;
  }
};

// Get top performers
export const getTopPerformers = async (period = '30d', limit = 5) => {
  try {
    const response = await api.get(`/analytics/top-performers?period=${period}&limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching top performers:', error);
    throw error;
  }
};

// Get dashboard stats (alias for getDashboardAnalytics)
export const getDashboardStats = async () => {
  try {
    const response = await api.get('/analytics/stats');
    return response.data;
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
};

export const analyticsAPI = {
  checkAuth,
  getDashboard: getDashboardAnalytics,
  getDashboardAnalytics,
  getDashboardStats,
  getSales: getSalesAnalytics,
  getInventory: getInventoryAnalytics,
  getProductivityTrends,
  getProjectDues,
  getTopPerformers
};

export default analyticsAPI;