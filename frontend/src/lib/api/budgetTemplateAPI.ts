import api from './axios';

export interface BudgetTemplate {
  _id: string;
  templateName: string;
  description: string;
  category: string;
  totalAmount: number;
  categories: Array<{
    categoryName: string;
    allocatedAmount: number;
    percentage: number;
  }>;
  isPublic: boolean;
  createdBy: { _id: string; name: string };
  usageCount: number;
  createdAt: string;
}

export interface CreateTemplateRequest {
  templateName: string;
  description: string;
  category: string;
  totalAmount: number;
  categories: Array<{
    categoryName: string;
    allocatedAmount: number;
  }>;
  isPublic: boolean;
}

export const budgetTemplateAPI = {
  createTemplate: async (data: CreateTemplateRequest) => {
    const response = await api.post('/budget-templates', data);
    return response.data;
  },

  createFromBudget: async (budgetId: string, templateName: string, description: string, isPublic: boolean) => {
    const response = await api.post(`/budget-templates/from-budget/${budgetId}`, {
      templateName,
      description,
      isPublic,
    });
    return response.data;
  },

  getTemplates: async (filters?: { category?: string; isPublic?: boolean }) => {
    const response = await api.get('/budget-templates', { params: filters });
    return response.data;
  },

  getPopularTemplates: async () => {
    const response = await api.get('/budget-templates/popular');
    return response.data;
  },

  getTemplateDetails: async (templateId: string) => {
    const response = await api.get(`/budget-templates/${templateId}`);
    return response.data;
  },

  updateTemplate: async (templateId: string, data: Partial<CreateTemplateRequest>) => {
    const response = await api.put(`/budget-templates/${templateId}`, data);
    return response.data;
  },

  deleteTemplate: async (templateId: string) => {
    const response = await api.delete(`/budget-templates/${templateId}`);
    return response.data;
  },

  cloneFromTemplate: async (templateId: string, budgetName: string, fiscalYear: string, adjustmentPercent?: number) => {
    const response = await api.post(`/budget-templates/${templateId}/clone`, {
      budgetName,
      fiscalYear,
      adjustmentPercent,
    });
    return response.data;
  },

  cloneBudget: async (budgetId: string, budgetName: string, fiscalYear: string, adjustmentPercent?: number) => {
    const response = await api.post(`/budget-templates/budget/${budgetId}/clone`, {
      budgetName,
      fiscalYear,
      adjustmentPercent,
    });
    return response.data;
  },
};
