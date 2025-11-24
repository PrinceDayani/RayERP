import api from './api';
import { Budget, BudgetTemplate, BudgetApproval } from '@/types/budget';

export interface CreateBudgetRequest {
  projectId?: string;
  projectName: string;
  totalBudget: number;
  currency: string;
  status?: 'draft' | 'pending' | 'approved' | 'rejected';
  categories: {
    name: string;
    type: 'labor' | 'materials' | 'equipment' | 'overhead';
    allocatedAmount: number;
    items: {
      name: string;
      description: string;
      quantity: number;
      unitCost: number;
    }[];
  }[];
}

export interface ApprovalRequest {
  comments?: string;
}

// Budget CRUD operations
export const getBudgets = async (): Promise<Budget[]> => {
  try {
    const response = await api.get('/budgets/all');
    return response.data?.data || response.data || [];
  } catch (error: any) {
    if (error.response?.status === 403 || error.response?.status === 404) {
      return [];
    }
    throw error;
  }
};

export const getAllBudgets = async (): Promise<Budget[]> => {
  try {
    const response = await api.get('/budgets/all');
    return response.data?.data || response.data || [];
  } catch (error: any) {
    if (error.response?.status === 403 || error.response?.status === 404) {
      return [];
    }
    throw error;
  }
};

export const getBudget = async (id: string): Promise<Budget> => {
  const response = await api.get(`/budgets/${id}`);
  return response.data;
};

export const createBudget = async (budgetData: CreateBudgetRequest): Promise<Budget> => {
  const response = await api.post('/budgets/create', budgetData);
  return response.data;
};

export const updateBudget = async (id: string, budgetData: Partial<CreateBudgetRequest>): Promise<Budget> => {
  const response = await api.put(`/budgets/${id}`, budgetData);
  return response.data;
};

export const deleteBudget = async (id: string): Promise<void> => {
  await api.delete(`/budgets/${id}`);
};

// Budget approval operations
export const getPendingApprovals = async (): Promise<Budget[]> => {
  try {
    const response = await api.get('/budgets/pending');
    return response.data?.data || response.data || [];
  } catch (error: any) {
    if (error.response?.status === 403) {
      return [];
    }
    throw error;
  }
};

export const approveBudget = async (id: string, data: ApprovalRequest): Promise<Budget> => {
  const response = await api.post(`/budgets/${id}/approve`, data);
  return response.data;
};

export const rejectBudget = async (id: string, data: ApprovalRequest): Promise<Budget> => {
  const response = await api.post(`/budgets/${id}/reject`, data);
  return response.data;
};

export const submitForApproval = async (id: string): Promise<Budget> => {
  const response = await api.post(`/budgets/${id}/submit`);
  return response.data;
};

// Budget templates
export const getBudgetTemplates = async (): Promise<BudgetTemplate[]> => {
  const response = await api.get('/budget-templates');
  return response.data;
};

export const createBudgetTemplate = async (templateData: Omit<BudgetTemplate, '_id' | 'createdAt'>): Promise<BudgetTemplate> => {
  const response = await api.post('/budget-templates', templateData);
  return response.data;
};

// Budget analytics
export const getBudgetAnalytics = async () => {
  try {
    const response = await api.get('/budgets/analytics');
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 403) {
      return {
        summary: {
          totalBudgets: 0,
          pendingApprovals: 0,
          approvedBudgets: 0,
          rejectedBudgets: 0,
          draftBudgets: 0,
          totalBudgetAmount: 0,
          totalSpent: 0
        },
        budgetsByStatus: [],
        budgetsByType: []
      };
    }
    throw error;
  }
};

export const getBudgetsByProject = async (projectId: string): Promise<Budget[]> => {
  const response = await api.get(`/projects/${projectId}/budgets`);
  return response.data?.data || response.data || [];
};

export const getProjectBudgetsWithApprovals = async (projectId: string): Promise<Budget[]> => {
  const response = await api.get(`/projects/${projectId}/budgets?needsApproval=true`);
  return response.data;
};

export const getProjectBudgetApprovals = async (projectId: string): Promise<Budget[]> => {
  const response = await api.get(`/projects/${projectId}/budgets`, {
    params: { status: 'pending,approved,rejected' }
  });
  return response.data;
};

export const getBudgetsByStatus = async (status: string): Promise<Budget[]> => {
  const response = await api.get(`/budgets/status/${status}`);
  return response.data?.data || response.data || [];
};

export const unapproveBudget = async (id: string, data: { comments?: string }): Promise<Budget> => {
  const response = await api.post(`/budgets/${id}/unapprove`, data);
  return response.data;
};

export const unrejectBudget = async (id: string, data: { comments?: string }): Promise<Budget> => {
  const response = await api.post(`/budgets/${id}/unreject`, data);
  return response.data;
};

export const syncProjectBudgets = async (): Promise<{ success: boolean; message: string; syncedCount: number }> => {
  const response = await api.post('/budgets/sync-projects');
  return response.data;
};

const budgetAPI = {
  getBudgets,
  getAllBudgets,
  getBudget,
  createBudget,
  updateBudget,
  deleteBudget,
  getPendingApprovals,
  approveBudget,
  rejectBudget,
  submitForApproval,
  getBudgetTemplates,
  createBudgetTemplate,
  getBudgetAnalytics,
  getBudgetsByProject,
  getBudgetsByStatus,
  getProjectBudgetsWithApprovals,
  getProjectBudgetApprovals,
  unapproveBudget,
  unrejectBudget,
  syncProjectBudgets,
};

export default budgetAPI;