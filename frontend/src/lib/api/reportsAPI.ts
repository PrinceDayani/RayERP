// path: frontend/src/lib/reportsAPI.ts
import api from './api';

export const reportsAPI = {
  // Get product categories data
  getProductCategories: async (from?: string, to?: string) => {
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    
    const response = await api.get(`/api/reports/product-categories?${params.toString()}`);
    return response.data;
  },

  // Get sales over time data
  getSalesOverTime: async (from: string, to: string) => {
    const params = new URLSearchParams();
    params.append('from', from);
    params.append('to', to);
    
    const response = await api.get(`/api/reports/sales-over-time?${params.toString()}`);
    return response.data;
  },

  // Get top selling products
  getTopSellingProducts: async (from?: string, to?: string, limit?: number) => {
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    if (limit) params.append('limit', limit.toString());
    
    const response = await api.get(`/api/reports/top-products?${params.toString()}`);
    return response.data;
  },

  // Get inventory status
  getInventoryStatus: async () => {
    const response = await api.get('/api/reports/inventory-status');
    return response.data;
  },

  // Get order status
  getOrderStatus: async (from?: string, to?: string) => {
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    
    const response = await api.get(`/api/reports/order-status?${params.toString()}`);
    return response.data;
  },

  // Export reports to CSV
  exportReport: async (reportType: string, params: any = {}) => {
    const queryParams = new URLSearchParams();
    
    // Add all parameters to the query string
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value as string);
      }
    });
    
    const response = await api.get(`/api/reports/export/${reportType}?${queryParams.toString()}`, {
      responseType: 'blob'
    });
    
    return response.data;
  }
};

// Export individual functions for flexibility
export const getProductCategories = reportsAPI.getProductCategories;
export const getSalesOverTime = reportsAPI.getSalesOverTime;
export const getTopSellingProducts = reportsAPI.getTopSellingProducts;
export const getInventoryStatus = reportsAPI.getInventoryStatus;
export const getOrderStatus = reportsAPI.getOrderStatus;
export const exportReport = reportsAPI.exportReport;

export default reportsAPI;