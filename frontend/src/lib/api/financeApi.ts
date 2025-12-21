// Unified Finance API Module
// Centralized API calls for all finance operations

import api from './api';

// ============================================================================
// RECURRING ENTRIES API
// ============================================================================
export const recurringEntriesAPI = {
  getAll: async () => api.get('/recurring-entries'),
  getById: async (id: string) => api.get(`/recurring-entries/${id}`),
  create: async (data: any) => api.post('/recurring-entries', data),
  update: async (id: string, data: any) => api.put(`/recurring-entries/${id}`, data),
  delete: async (id: string) => api.delete(`/recurring-entries/${id}`),
  execute: async (id: string) => api.post(`/recurring-entries/${id}/execute`),
  getFailed: async () => api.get('/recurring-entries/failed'),
  getPendingApprovals: async () => api.get('/recurring-entries/pending-approvals'),
  getHistory: async (id: string) => api.get(`/recurring-entries/${id}/history`),
  skipNext: async (id: string) => api.post(`/recurring-entries/${id}/skip-next`),
  retry: async (id: string) => api.post(`/recurring-entries/${id}/retry`),
  approve: async (id: string) => api.post(`/recurring-entries/${id}/approve`),
  batchApprove: async (ids: string[]) => api.post('/recurring-entries/batch-approve', { ids }),
};

// ============================================================================
// INVOICES API
// ============================================================================
export const invoicesAPI = {
  getAll: async () => api.get('/invoices'),
  getById: async (id: string) => api.get(`/invoices/${id}`),
  create: async (data: any) => api.post('/invoices', data),
  update: async (id: string, data: any) => api.put(`/invoices/${id}`, data),
  delete: async (id: string) => api.delete(`/invoices/${id}`),
  generatePDF: async (id: string) => api.get(`/invoices/${id}/pdf`, { responseType: 'blob' }),
  sendEmail: async (id: string, email: string) => api.post(`/invoices/${id}/send`, { email }),
};

// ============================================================================
// PAYMENTS API
// ============================================================================
export const paymentsAPI = {
  getAll: async () => api.get('/payments'),
  getById: async (id: string) => api.get(`/payments/${id}`),
  create: async (data: any) => api.post('/payments', data),
  update: async (id: string, data: any) => api.put(`/payments/${id}`, data),
  delete: async (id: string) => api.delete(`/payments/${id}`),
  getAnalytics: async () => api.get('/payments/analytics'),
  approve: async (id: string) => api.post(`/payments/${id}/approve`),
  reconcile: async (id: string) => api.post(`/payments/${id}/reconcile`),
  createJournalEntry: async (id: string) => api.post(`/payments/${id}/journal-entry`),
};

// ============================================================================
// BILLS API
// ============================================================================
export const billsAPI = {
  getAll: async () => api.get('/bills'),
  getById: async (id: string) => api.get(`/bills/${id}`),
  create: async (data: any) => api.post('/bills', data),
  update: async (id: string, data: any) => api.put(`/bills/${id}`, data),
  delete: async (id: string) => api.delete(`/bills/${id}`),
  getSummary: async () => api.get('/bills/summary'),
};

// ============================================================================
// ACCOUNTS API
// ============================================================================
export const accountsAPI = {
  getAll: async (params?: { page?: number; limit?: number }) => api.get('/chart-of-accounts', { params: { limit: 10000, ...params } }),
  getById: async (id: string) => api.get(`/chart-of-accounts/${id}`),
  create: async (data: any) => api.post('/chart-of-accounts', data),
  update: async (id: string, data: any) => api.put(`/chart-of-accounts/${id}`, data),
  delete: async (id: string) => api.delete(`/chart-of-accounts/${id}`),
};

// ============================================================================
// BANK RECONCILIATION API
// ============================================================================
export const bankReconciliationAPI = {
  getAll: async () => api.get('/bank-reconciliation'),
  getById: async (id: string) => api.get(`/bank-reconciliation/${id}`),
  create: async (data: any) => api.post('/bank-reconciliation', data),
  update: async (id: string, data: any) => api.put(`/bank-reconciliation/${id}`, data),
  reconcile: async (id: string) => api.post(`/bank-reconciliation/${id}/reconcile`),
}

  ;

// ============================================================================
// TAX MANAGEMENT API
// ============================================================================
export const taxManagementAPI = {
  // Read operations
  getTaxSettings: async () => api.get('/tax-management/settings'),
  getTaxLiabilities: async (params?: any) => api.get('/tax-management/liabilities', { params }),
  getGSTReturns: async (params?: any) => api.get('/tax-management/gst-returns', { params }),
  getById: async (id: string) => api.get(`/tax-management/${id}`),

  // Create operation
  create: async (data: any) => api.post('/tax-management', data),

  // Update operations
  update: async (id: string, data: any) => api.put(`/tax-management/${id}`, data),
  updateTaxSettings: async (data: any) => api.put('/tax-management/settings', data),

  // Delete operation
  delete: async (id: string) => api.delete(`/tax-management/${id}`),

  // GST operations
  fileGSTReturn: async (data: any) => api.post('/tax-management/gst-returns', data),

  // Calculator operations
  calculateTDS: async (amount: number, rate: number) =>
    api.post('/tax-management/calculate-tds', { amount, rate }),
  calculateIncomeTax: async (income: number, deductions?: number) =>
    api.post('/tax-management/calculate-income-tax', { income, deductions }),
};

// ============================================================================
// AGING ANALYSIS API (existing)
// ============================================================================
export const agingAnalysisAPI = {
  getReceivables: async (params?: any) => api.get('/aging-analysis/receivables', { params }),
  getPayables: async (params?: any) => api.get('/aging-analysis/payables', { params }),
  getSummary: async () => api.get('/aging-analysis/summary'),
  exportReport: async (type: 'receivables' | 'payables') =>
    api.get(`/aging-analysis/export/${type}`, { responseType: 'blob' }),
};
