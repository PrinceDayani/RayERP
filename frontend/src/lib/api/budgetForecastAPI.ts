import api from './axios';

export interface BudgetForecast {
  _id: string;
  budget: string;
  algorithm: 'linear' | 'seasonal' | 'exponential' | 'ml';
  forecastPeriod: number;
  generatedAt: string;
  predictions: Array<{
    month: number;
    year: number;
    predictedAmount: number;
    confidenceInterval: {
      lower: number;
      upper: number;
    };
  }>;
  accuracy?: {
    mape: number;
    rmse: number;
    calculatedAt: string;
  };
}

export interface GenerateForecastRequest {
  algorithm?: 'linear' | 'seasonal' | 'exponential' | 'ml';
  forecastPeriod?: number;
}

export const budgetForecastAPI = {
  generateForecast: async (budgetId: string, data: GenerateForecastRequest) => {
    const response = await api.post(`/budget-forecasts/budget/${budgetId}/generate`, data);
    return response.data;
  },

  getForecasts: async (budgetId: string) => {
    const response = await api.get(`/budget-forecasts/budget/${budgetId}`);
    return response.data;
  },

  getForecastSummary: async (budgetId: string) => {
    const response = await api.get(`/budget-forecasts/budget/${budgetId}/summary`);
    return response.data;
  },

  getForecastDetails: async (forecastId: string) => {
    const response = await api.get(`/budget-forecasts/${forecastId}`);
    return response.data;
  },

  calculateAccuracy: async (forecastId: string) => {
    const response = await api.post(`/budget-forecasts/${forecastId}/accuracy`);
    return response.data;
  },
};
