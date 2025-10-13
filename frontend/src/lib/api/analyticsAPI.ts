// path: frontend/src/lib/analyticsAPI.ts
import api from './api';

// Get dashboard analytics data
export const getDashboardAnalytics = async () => {
  try {
    const response = await api.get('/api/analytics/dashboard');
    return response.data;
  } catch (error) {
    console.error('Error fetching dashboard analytics:', error);
    throw error;
  }
};

// Get sales analytics data
export const getSalesAnalytics = async () => {
  try {
    const response = await api.get('/api/analytics/sales');
    return response.data;
  } catch (error) {
    console.error('Error fetching sales analytics:', error);
    throw error;
  }
};

// Get inventory analytics data
export const getInventoryAnalytics = async () => {
  try {
    const response = await api.get('/api/analytics/inventory');
    return response.data;
  } catch (error) {
    console.error('Error fetching inventory analytics:', error);
    throw error;
  }
};

export const analyticsAPI = {
  getDashboard: getDashboardAnalytics,
  getSales: getSalesAnalytics,
  getInventory: getInventoryAnalytics
};

export default analyticsAPI;