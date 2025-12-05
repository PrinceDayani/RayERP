import api from './api';

export interface ApprovalLevel {
  level: number;
  name: string;
  requiredRole: string;
  amountThreshold: number;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: {
    _id: string;
    name: string;
    email: string;
  };
  approvedAt?: string;
  comments?: string;
}

export interface BudgetApprovalWorkflow {
  _id: string;
  budgetId: string;
  totalLevels: number;
  currentLevel: number;
  levels: ApprovalLevel[];
  autoApproveUnder: number;
  status: 'pending' | 'in-progress' | 'approved' | 'rejected';
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export const budgetApprovalAPI = {
  // Create approval workflow
  createWorkflow: async (budgetId: string, totalBudget: number) => {
    const response = await api.post('/budget-approvals', { budgetId, totalBudget });
    return response.data;
  },

  // Get workflow for budget
  getWorkflow: async (budgetId: string) => {
    const response = await api.get(`/budget-approvals/budget/${budgetId}`);
    return response.data;
  },

  // Approve at level
  approveLevel: async (budgetId: string, level: number, comments?: string) => {
    const response = await api.post(`/budget-approvals/${budgetId}/approve/${level}`, { comments });
    return response.data;
  },

  // Reject at level
  rejectLevel: async (budgetId: string, level: number, comments: string) => {
    const response = await api.post(`/budget-approvals/${budgetId}/reject/${level}`, { comments });
    return response.data;
  },

  // Get pending approvals
  getPendingApprovals: async () => {
    const response = await api.get('/budget-approvals/pending');
    return response.data;
  }
};
