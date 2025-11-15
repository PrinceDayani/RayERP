import api from './api';

export const invoiceAPI = {
  // Create invoice
  create: async (data: any) => {
    const response = await api.post('/invoices-new', data);
    return response.data;
  },

  // Get all invoices
  getAll: async (filters?: any) => {
    const response = await api.get('/invoices-new', { params: filters });
    return response.data;
  },

  // Get invoice stats
  getStats: async () => {
    const response = await api.get('/invoices-new/stats');
    return response.data;
  },

  // Get aging report
  getAgingReport: async () => {
    const response = await api.get('/invoices-new/aging-report');
    return response.data;
  },

  // Get by ID
  getById: async (id: string) => {
    const response = await api.get(`/invoices-new/${id}`);
    return response.data;
  },

  // Update invoice
  update: async (id: string, data: any) => {
    const response = await api.put(`/invoices-new/${id}`, data);
    return response.data;
  },

  // Delete invoice
  delete: async (id: string) => {
    const response = await api.delete(`/invoices-new/${id}`);
    return response.data;
  },

  // Approve invoice
  approve: async (id: string, comments?: string) => {
    const response = await api.post(`/invoices-new/${id}/approve`, { comments });
    return response.data;
  },

  // Send invoice
  send: async (id: string) => {
    const response = await api.post(`/invoices-new/${id}/send`);
    return response.data;
  },

  // Record payment
  recordPayment: async (id: string, payment: any) => {
    const response = await api.post(`/invoices-new/${id}/payment`, payment);
    return response.data;
  },

  // Post invoice (create JE)
  post: async (id: string) => {
    const response = await api.post(`/invoices-new/${id}/post`);
    return response.data;
  },

  // Upload attachment
  uploadAttachment: async (id: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/invoices-new/${id}/attachment`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  // Batch create
  batchCreate: async (invoices: any[]) => {
    const response = await api.post('/invoices-new/batch', { invoices });
    return response.data;
  },

  // Generate recurring
  generateRecurring: async () => {
    const response = await api.post('/invoices-new/generate-recurring');
    return response.data;
  },

  // Send reminders
  sendReminders: async () => {
    const response = await api.post('/invoices-new/send-reminders');
    return response.data;
  },

  // Calculate late fees
  calculateLateFees: async () => {
    const response = await api.post('/invoices-new/calculate-late-fees');
    return response.data;
  }
};
