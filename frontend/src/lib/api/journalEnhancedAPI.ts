import api from './api';

const BASE_URL = '/journal-enhanced';

export const journalEnhancedAPI = {
  // Recurring Entries
  generateRecurring: async () => {
    const response = await api.post(`${BASE_URL}/recurring/generate`);
    return response.data;
  },

  // Reversing Entries
  reverseEntry: async (entryId: string, data?: { reverseDate?: string }) => {
    const response = await api.post(`${BASE_URL}/${entryId}/reverse`, data);
    return response.data;
  },

  // Templates
  createFromTemplate: async (templateId: string, data: { date?: string; reference?: string; variables?: any }) => {
    const response = await api.post(`${BASE_URL}/from-template/${templateId}`, data);
    return response.data;
  },

  // Batch Import
  batchImport: async (entries: any[]) => {
    const response = await api.post(`${BASE_URL}/batch-import`, { entries });
    return response.data;
  },

  // Allocation Rules
  applyAllocation: async (ruleId: string, data: { amount: number; date?: string; description: string }) => {
    const response = await api.post(`${BASE_URL}/allocate/${ruleId}`, data);
    return response.data;
  },

  // Approval
  approveEntry: async (entryId: string) => {
    const response = await api.post(`${BASE_URL}/${entryId}/approve`);
    return response.data;
  },

  // Bulk Operations
  bulkPost: async (entryIds: string[]) => {
    const response = await api.post(`${BASE_URL}/bulk-post`, { entryIds });
    return response.data;
  },

  // Budget Impact
  getBudgetImpact: async (lines: any[]) => {
    const response = await api.post(`${BASE_URL}/budget-impact`, { lines });
    return response.data;
  },

  // Smart Suggestions
  getAccountSuggestions: async (description: string) => {
    const response = await api.get(`${BASE_URL}/suggestions/accounts`, { params: { description } });
    return response.data;
  },

  // Attachments
  addAttachment: async (entryId: string, data: { filename: string; url: string }) => {
    const response = await api.post(`${BASE_URL}/${entryId}/attachments`, data);
    return response.data;
  },

  // Copy Entry
  copyEntry: async (entryId: string) => {
    const response = await api.post(`${BASE_URL}/${entryId}/copy`);
    return response.data;
  }
};

export default journalEnhancedAPI;
