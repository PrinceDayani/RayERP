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

export const analyticsAPI = {
  checkAuth,
  getDashboard: getDashboardAnalytics,
  getDashboardAnalytics,
  getSales: getSalesAnalytics,
  getInventory: getInventoryAnalytics
};

export default analyticsAPI;