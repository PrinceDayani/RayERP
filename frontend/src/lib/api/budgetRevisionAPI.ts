import api from './api';

export interface BudgetRevision {
  version: number;
  revisedBy: {
    _id: string;
    name: string;
  };
  revisedAt: string;
  reason: string;
  changes: any;
  approvedBy?: {
    _id: string;
    name: string;
  };
  approvedAt?: string;
}

export interface BudgetVersion {
  _id: string;
  budgetName: string;
  budgetVersion: number;
  totalAmount: number;
  allocatedAmount: number;
  fiscalYear: string;
  status: string;
  isLatestVersion: boolean;
  previousVersionId?: string;
  revisionHistory: BudgetRevision[];
  createdAt: string;
  updatedAt: string;
}

export const budgetRevisionAPI = {
  // Create new revision
  createRevision: async (budgetId: string, reason: string, changes: any) => {
    const response = await api.post(`/budget-revisions/${budgetId}/create`, { reason, changes });
    return response.data;
  },

  // Get all versions
  getVersions: async (budgetId: string) => {
    const response = await api.get(`/budget-revisions/${budgetId}/versions`);
    return response.data;
  },

  // Compare versions
  compareVersions: async (budgetId: string, version1: number, version2: number) => {
    const response = await api.get(`/budget-revisions/${budgetId}/compare`, {
      params: { version1, version2 }
    });
    return response.data;
  },

  // Restore version
  restoreVersion: async (budgetId: string, versionId: string, reason: string) => {
    const response = await api.post(`/budget-revisions/${budgetId}/restore/${versionId}`, { reason });
    return response.data;
  },

  // Get revision history
  getRevisionHistory: async (budgetId: string) => {
    const response = await api.get(`/budget-revisions/${budgetId}/history`);
    return response.data;
  }
};
