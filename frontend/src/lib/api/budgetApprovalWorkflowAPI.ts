import api from './api';

export interface ApprovalWorkflow {
  _id: string;
  budgetId: string;
  enabled: boolean;
  currentLevel: number;
  totalLevels: number;
  levels: ApprovalLevel[];
  autoApproveUnder: number;
  status: 'pending' | 'in-progress' | 'approved' | 'rejected';
  startedAt: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApprovalLevel {
  level: number;
  name: string;
  requiredRole: string;
  amountThreshold: number;
  approvers: string[];
  status: 'pending' | 'approved' | 'rejected' | 'skipped';
  approvedBy?: string;
  approvedAt?: string;
  comments?: string;
  deadline?: string;
}

export interface WorkflowMetrics {
  totalWorkflows: number;
  pendingWorkflows: number;
  approvedWorkflows: number;
  rejectedWorkflows: number;
  avgProcessingTime: number;
  overdueWorkflows: number;
  workflowsByLevel: {
    level: number;
    count: number;
  }[];
}

// Create approval workflow for budget
export const createApprovalWorkflow = async (budgetId: string, totalBudget: number): Promise<ApprovalWorkflow> => {
  const response = await api.post('/budget-approval-workflow/create', {
    budgetId,
    totalBudget
  });
  return response.data.data;
};

// Get workflow for budget
export const getWorkflow = async (budgetId: string): Promise<ApprovalWorkflow> => {
  const response = await api.get(`/budget-approval-workflow/${budgetId}`);
  return response.data.data;
};

// Approve at specific level
export const approveLevel = async (budgetId: string, level: number, comments?: string): Promise<ApprovalWorkflow> => {
  const response = await api.post(`/budget-approval-workflow/${budgetId}/approve/${level}`, {
    comments
  });
  return response.data.data;
};

// Reject at specific level
export const rejectLevel = async (budgetId: string, level: number, comments: string): Promise<ApprovalWorkflow> => {
  const response = await api.post(`/budget-approval-workflow/${budgetId}/reject/${level}`, {
    comments
  });
  return response.data.data;
};

// Get pending approvals for current user
export const getPendingWorkflowApprovals = async (): Promise<ApprovalWorkflow[]> => {
  try {
    const response = await api.get('/budget-approval-workflow/pending');
    return response.data.data || [];
  } catch (error: any) {
    if (error.response?.status === 403) {
      return [];
    }
    throw error;
  }
};

// Get workflow metrics
export const getWorkflowMetrics = async (): Promise<WorkflowMetrics> => {
  try {
    const response = await api.get('/budget-approval-workflow/metrics');
    return response.data.data;
  } catch (error: any) {
    if (error.response?.status === 403) {
      return {
        totalWorkflows: 0,
        pendingWorkflows: 0,
        approvedWorkflows: 0,
        rejectedWorkflows: 0,
        avgProcessingTime: 0,
        overdueWorkflows: 0,
        workflowsByLevel: []
      };
    }
    throw error;
  }
};

// Get all workflows with filters
export const getWorkflows = async (filters?: {
  status?: string;
  level?: number;
  overdue?: boolean;
}): Promise<ApprovalWorkflow[]> => {
  try {
    const response = await api.get('/budget-approval-workflow/all', {
      params: filters
    });
    return response.data.data || [];
  } catch (error: any) {
    if (error.response?.status === 403) {
      return [];
    }
    throw error;
  }
};

// Skip level (for auto-approval scenarios)
export const skipLevel = async (budgetId: string, level: number, reason: string): Promise<ApprovalWorkflow> => {
  const response = await api.post(`/budget-approval-workflow/${budgetId}/skip/${level}`, {
    reason
  });
  return response.data.data;
};

// Reset workflow
export const resetWorkflow = async (budgetId: string): Promise<ApprovalWorkflow> => {
  const response = await api.post(`/budget-approval-workflow/${budgetId}/reset`);
  return response.data.data;
};

const budgetApprovalWorkflowAPI = {
  createApprovalWorkflow,
  getWorkflow,
  approveLevel,
  rejectLevel,
  getPendingWorkflowApprovals,
  getWorkflowMetrics,
  getWorkflows,
  skipLevel,
  resetWorkflow
};

export default budgetApprovalWorkflowAPI;