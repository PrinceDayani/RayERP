import api from './api';

export const budgetDashboardAPI = {
  getOverview: async () => {
    const response = await api.get('/budget-dashboard/overview');
    return response.data;
  },

  getByStatus: async () => {
    const response = await api.get('/budget-dashboard/by-status');
    return response.data;
  },

  getByDepartment: async () => {
    const response = await api.get('/budget-dashboard/by-department');
    return response.data;
  },

  getUtilizationTrends: async () => {
    const response = await api.get('/budget-dashboard/utilization-trends');
    return response.data;
  },

  getTopBudgets: async () => {
    const response = await api.get('/budget-dashboard/top-budgets');
    return response.data;
  },

  getAlertsSummary: async () => {
    const response = await api.get('/budget-dashboard/alerts-summary');
    return response.data;
  },

  getTransferActivity: async () => {
    const response = await api.get('/budget-dashboard/transfer-activity');
    return response.data;
  },

  getApprovalStats: async () => {
    const response = await api.get('/budget-dashboard/approval-stats');
    return response.data;
  },

  getFiscalYearComparison: async () => {
    const response = await api.get('/budget-dashboard/fiscal-year-comparison');
    return response.data;
  },

  getHealthScore: async () => {
    const response = await api.get('/budget-dashboard/health-score');
    return response.data;
  },
};
