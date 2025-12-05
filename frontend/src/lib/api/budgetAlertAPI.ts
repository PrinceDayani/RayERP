import api from './api';

export interface BudgetAlert {
  _id: string;
  budget: {
    _id: string;
    budgetName: string;
    totalAmount: number;
    allocatedAmount: number;
  };
  alertType: 'warning' | 'alert' | 'critical';
  threshold: number;
  currentUtilization: number;
  message: string;
  isAcknowledged: boolean;
  acknowledgedBy?: {
    _id: string;
    name: string;
  };
  acknowledgedAt?: string;
  notifiedUsers: string[];
  createdAt: string;
  updatedAt: string;
}

export const budgetAlertAPI = {
  // Get alerts for budget
  getBudgetAlerts: async (budgetId: string) => {
    const response = await api.get(`/budget-alerts/budget/${budgetId}`);
    return response.data;
  },

  // Get alert by ID
  getAlertById: async (alertId: string) => {
    const response = await api.get(`/budget-alerts/${alertId}`);
    return response.data;
  },

  // Acknowledge alert
  acknowledgeAlert: async (alertId: string) => {
    const response = await api.post(`/budget-alerts/${alertId}/acknowledge`);
    return response.data;
  },

  // Get unacknowledged alerts
  getUnacknowledgedAlerts: async () => {
    const response = await api.get('/budget-alerts/unacknowledged');
    return response.data;
  }
};
