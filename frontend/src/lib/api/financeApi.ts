import api from './api';

export const taxManagementAPI = {
  getTaxRecords: async () => {
    try {
      const response = await api.get('/finance/tax/records');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error };
    }
  },

  getTaxStats: async () => {
    try {
      const response = await api.get('/finance/tax/stats');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error };
    }
  }
};

export const agingAnalysisAPI = {
  getAgingData: async (type: 'receivables' | 'payables') => {
    try {
      const response = await api.get(`/finance/aging/${type}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error };
    }
  },

  getAgingSummary: async (type: 'receivables' | 'payables') => {
    try {
      const response = await api.get(`/finance/aging/${type}/summary`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error };
    }
  }
};