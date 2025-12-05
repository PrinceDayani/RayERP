import api from './axios';

export interface BudgetTransfer {
  _id: string;
  fromBudget: {
    _id: string;
    budgetName: string;
    departmentId?: { name: string };
  };
  toBudget: {
    _id: string;
    budgetName: string;
    departmentId?: { name: string };
  };
  amount: number;
  reason: string;
  fiscalYear: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedBy: { _id: string; name: string };
  approvedBy?: { _id: string; name: string };
  rejectedBy?: { _id: string; name: string };
  rejectionReason?: string;
  requestedAt: string;
  processedAt?: string;
}

export interface CreateTransferRequest {
  fromBudgetId: string;
  toBudgetId: string;
  amount: number;
  reason: string;
  fiscalYear: string;
}

export const budgetTransferAPI = {
  createTransfer: async (data: CreateTransferRequest) => {
    const response = await api.post('/budget-transfers', data);
    return response.data;
  },

  approveTransfer: async (transferId: string) => {
    const response = await api.post(`/budget-transfers/${transferId}/approve`);
    return response.data;
  },

  rejectTransfer: async (transferId: string, reason: string) => {
    const response = await api.post(`/budget-transfers/${transferId}/reject`, { reason });
    return response.data;
  },

  getAllTransfers: async (filters?: { status?: string; fiscalYear?: string }) => {
    const response = await api.get('/budget-transfers', { params: filters });
    return response.data;
  },

  getPendingTransfers: async () => {
    const response = await api.get('/budget-transfers/pending');
    return response.data;
  },

  getTransferDetails: async (transferId: string) => {
    const response = await api.get(`/budget-transfers/${transferId}`);
    return response.data;
  },

  getTransferHistory: async (budgetId: string) => {
    const response = await api.get(`/budget-transfers/budget/${budgetId}/history`);
    return response.data;
  },
};
