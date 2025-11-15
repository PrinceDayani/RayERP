import api from './api';

export const journalEntryAPI = {
  // Create entry
  create: async (data: any) => {
    const response = await api.post('/journal-entries', data);
    return response.data;
  },

  // Get all entries
  getAll: async (filters?: any) => {
    const response = await api.get('/journal-entries', { params: filters });
    return response.data;
  },

  // Get stats
  getStats: async () => {
    const response = await api.get('/journal-entries/stats');
    return response.data;
  },

  // Get by ID
  getById: async (id: string) => {
    const response = await api.get(`/journal-entries/${id}`);
    return response.data;
  },

  // Update entry
  update: async (id: string, data: any) => {
    const response = await api.put(`/journal-entries/${id}`, data);
    return response.data;
  },

  // Delete entry
  delete: async (id: string) => {
    const response = await api.delete(`/journal-entries/${id}`);
    return response.data;
  },

  // Approve entry
  approve: async (id: string, comments?: string) => {
    const response = await api.post(`/journal-entries/${id}/approve`, { comments });
    return response.data;
  },

  // Post entry
  post: async (id: string) => {
    const response = await api.post(`/journal-entries/${id}/post`);
    return response.data;
  },

  // Reverse entry
  reverse: async (id: string, reason: string) => {
    const response = await api.post(`/journal-entries/${id}/reverse`, { reason });
    return response.data;
  },

  // Copy entry
  copy: async (id: string, entryDate?: string) => {
    const response = await api.post(`/journal-entries/${id}/copy`, { entryDate });
    return response.data;
  },

  // Upload attachment
  uploadAttachment: async (id: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/journal-entries/${id}/attachment`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  // Batch post
  batchPost: async (entryIds: string[]) => {
    const response = await api.post('/journal-entries/batch-post', { entryIds });
    return response.data;
  },

  // Create from template
  createFromTemplate: async (templateId: string, variables: any, entryDate: string) => {
    const response = await api.post(`/journal-entries/from-template/${templateId}`, { variables, entryDate });
    return response.data;
  },

  // Generate recurring
  generateRecurring: async () => {
    const response = await api.post('/journal-entries/generate-recurring');
    return response.data;
  },

  // Bulk import
  bulkImport: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/journal-entries/bulk-import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  // Lock period
  lockPeriod: async (year: number, month: number) => {
    const response = await api.post('/journal-entries/lock-period', { year, month });
    return response.data;
  }
};

export const journalEntryTemplateAPI = {
  // Get all templates
  getAll: async (category?: string) => {
    const response = await api.get('/journal-entry-templates', { params: { category } });
    return response.data;
  },

  // Create template
  create: async (data: any) => {
    const response = await api.post('/journal-entry-templates', data);
    return response.data;
  },

  // Get by ID
  getById: async (id: string) => {
    const response = await api.get(`/journal-entry-templates/${id}`);
    return response.data;
  },

  // Update template
  update: async (id: string, data: any) => {
    const response = await api.put(`/journal-entry-templates/${id}`, data);
    return response.data;
  },

  // Delete template
  delete: async (id: string) => {
    const response = await api.delete(`/journal-entry-templates/${id}`);
    return response.data;
  }
};
