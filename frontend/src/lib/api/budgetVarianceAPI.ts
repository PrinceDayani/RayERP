import api from './axios';

export interface BudgetVariance {
  _id: string;
  budget: string;
  period: {
    startDate: string;
    endDate: string;
  };
  totalBudgeted: number;
  totalActual: number;
  totalVariance: number;
  totalVariancePercent: number;
  overallStatus: 'favorable' | 'unfavorable' | 'neutral';
  categoryVariances: Array<{
    categoryName: string;
    budgeted: number;
    actual: number;
    variance: number;
    variancePercent: number;
    status: 'favorable' | 'unfavorable' | 'neutral';
  }>;
  insights: string[];
  recommendations: string[];
  generatedAt: string;
}

export interface GenerateVarianceRequest {
  startDate: string;
  endDate: string;
}

export const budgetVarianceAPI = {
  generateVariance: async (budgetId: string, data: GenerateVarianceRequest) => {
    const response = await api.post(`/budget-variances/budget/${budgetId}/generate`, data);
    return response.data;
  },

  getVariances: async (budgetId: string) => {
    const response = await api.get(`/budget-variances/budget/${budgetId}`);
    return response.data;
  },

  getVarianceSummary: async (budgetId: string) => {
    const response = await api.get(`/budget-variances/budget/${budgetId}/summary`);
    return response.data;
  },

  getVarianceTrends: async (budgetId: string) => {
    const response = await api.get(`/budget-variances/budget/${budgetId}/trends`);
    return response.data;
  },

  getVarianceDetails: async (varianceId: string) => {
    const response = await api.get(`/budget-variances/${varianceId}`);
    return response.data;
  },
};
