import api from './api';

export interface ApprovalLevel {
  level: number;
  approverRole: string;
  approverIds: string[];
  amountThreshold: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SKIPPED';
  approvedBy?: {
    _id: string;
    name: string;
    email: string;
  };
  approvedAt?: string;
  comments?: string;
}

export interface ApprovalRequest {
  _id: string;
  entityType: 'JOURNAL' | 'PAYMENT' | 'INVOICE' | 'EXPENSE' | 'VOUCHER';
  entityId: string;
  title: string;
  description?: string;
  amount: number;
  requestedBy: {
    _id: string;
    name: string;
    email: string;
  };
  requestedAt: string;
  currentLevel: number;
  totalLevels: number;
  approvalLevels: ApprovalLevel[];
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  metadata?: any;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApprovalStats {
  pending: number;
  underReview: number;
  approvedToday: number;
  totalAmount: number;
  recentApprovals: ApprovalRequest[];
}

export interface ApprovalFilters {
  status?: string;
  entityType?: string;
  priority?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export const approvalsAPI = {
  // Create approval request
  create: async (data: {
    entityType: string;
    entityId: string;
    title: string;
    description?: string;
    amount: number;
    metadata?: any;
  }) => {
    const response = await api.post('/approvals', data);
    return response.data;
  },

  // Get pending approvals
  getPending: async () => {
    const response = await api.get('/approvals/pending');
    return response.data;
  },

  // Get all approvals with filters
  getAll: async (filters?: ApprovalFilters) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) params.append(key, String(value));
      });
    }
    const response = await api.get(`/approvals?${params.toString()}`);
    return response.data;
  },

  // Get approval by ID
  getById: async (id: string) => {
    const response = await api.get(`/approvals/${id}`);
    return response.data;
  },

  // Approve request
  approve: async (id: string, comments?: string) => {
    const response = await api.post(`/approvals/${id}/approve`, { comments });
    return response.data;
  },

  // Reject request
  reject: async (id: string, reason: string) => {
    const response = await api.post(`/approvals/${id}/reject`, { reason });
    return response.data;
  },

  // Get approval statistics
  getStats: async () => {
    const response = await api.get('/approvals/stats');
    return response.data;
  },

  // Get approval history
  getHistory: async (page = 1, limit = 20) => {
    const response = await api.get(`/approvals/history?page=${page}&limit=${limit}`);
    return response.data;
  },

  // Send reminder
  sendReminder: async (id: string) => {
    const response = await api.post(`/approvals/${id}/remind`);
    return response.data;
  },

  // Search
  search: async (query: string) => {
    const response = await api.get(`/approvals/search?query=${query}`);
    return response.data;
  }
};
