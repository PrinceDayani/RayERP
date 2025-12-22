// Unified Finance API Module
// Centralized API calls for all finance operations

let api: any;

// Lazy load api to avoid SSR issues
const getApi = async () => {
  if (!api) {
    const module = await import('./api');
    api = module.default;
  }
  return api;
};

// ============================================================================
// RECURRING ENTRIES API
// ============================================================================
export const recurringEntriesAPI = {
  getAll: async () => (await getApi()).get('/recurring-entries'),
  getById: async (id: string) => (await getApi()).get(`/recurring-entries/${id}`),
  create: async (data: any) => (await getApi()).post('/recurring-entries', data),
  update: async (id: string, data: any) => (await getApi()).put(`/recurring-entries/${id}`, data),
  delete: async (id: string) => (await getApi()).delete(`/recurring-entries/${id}`),
  execute: async (id: string) => (await getApi()).post(`/recurring-entries/${id}/execute`),
  getFailed: async () => (await getApi()).get('/recurring-entries/failed'),
  getPendingApprovals: async () => (await getApi()).get('/recurring-entries/pending-approvals'),
  getHistory: async (id: string) => (await getApi()).get(`/recurring-entries/${id}/history`),
  skipNext: async (id: string) => (await getApi()).post(`/recurring-entries/${id}/skip-next`),
  retry: async (id: string) => (await getApi()).post(`/recurring-entries/${id}/retry`),
  approve: async (id: string) => (await getApi()).post(`/recurring-entries/${id}/approve`),
  batchApprove: async (ids: string[]) => (await getApi()).post('/recurring-entries/batch-approve', { ids }),
};

// ============================================================================
// INVOICES API
// ============================================================================
export const invoicesAPI = {
  getAll: async () => (await getApi()).get('/invoices'),
  getById: async (id: string) => (await getApi()).get(`/invoices/${id}`),
  create: async (data: any) => (await getApi()).post('/invoices', data),
  update: async (id: string, data: any) => (await getApi()).put(`/invoices/${id}`, data),
  delete: async (id: string) => (await getApi()).delete(`/invoices/${id}`),
  generatePDF: async (id: string) => (await getApi()).get(`/invoices/${id}/pdf`, { responseType: 'blob' }),
  sendEmail: async (id: string, email: string) => (await getApi()).post(`/invoices/${id}/send`, { email }),
};

// ============================================================================
// PAYMENTS API
// ============================================================================
export const paymentsAPI = {
  getAll: async () => (await getApi()).get('/payments'),
  getById: async (id: string) => (await getApi()).get(`/payments/${id}`),
  create: async (data: any) => (await getApi()).post('/payments', data),
  update: async (id: string, data: any) => (await getApi()).put(`/payments/${id}`, data),
  delete: async (id: string) => (await getApi()).delete(`/payments/${id}`),
  getAnalytics: async () => (await getApi()).get('/payments/analytics'),
  approve: async (id: string) => (await getApi()).post(`/payments/${id}/approve`),
  reconcile: async (id: string) => (await getApi()).post(`/payments/${id}/reconcile`),
  createJournalEntry: async (id: string) => (await getApi()).post(`/payments/${id}/journal-entry`),
};

// ============================================================================
// BILLS API
// ============================================================================
export const billsAPI = {
  getAll: async () => (await getApi()).get('/bills'),
  getById: async (id: string) => (await getApi()).get(`/bills/${id}`),
  create: async (data: any) => (await getApi()).post('/bills', data),
  update: async (id: string, data: any) => (await getApi()).put(`/bills/${id}`, data),
  delete: async (id: string) => (await getApi()).delete(`/bills/${id}`),
  getSummary: async () => (await getApi()).get('/bills/summary'),
};

// ============================================================================
// ACCOUNTS API
// ============================================================================
export const accountsAPI = {
  getAll: async (params?: { page?: number; limit?: number }) => (await getApi()).get('/chart-of-accounts', { params: { limit: 10000, ...params } }),
  getById: async (id: string) => (await getApi()).get(`/chart-of-accounts/${id}`),
  create: async (data: any) => (await getApi()).post('/chart-of-accounts', data),
  update: async (id: string, data: any) => (await getApi()).put(`/chart-of-accounts/${id}`, data),
  delete: async (id: string) => (await getApi()).delete(`/chart-of-accounts/${id}`),
};

// ============================================================================
// BANK RECONCILIATION API
// ============================================================================
export const bankReconciliationAPI = {
  getAll: async () => (await getApi()).get('/bank-reconciliation'),
  getById: async (id: string) => (await getApi()).get(`/bank-reconciliation/${id}`),
  create: async (data: any) => (await getApi()).post('/bank-reconciliation', data),
  update: async (id: string, data: any) => (await getApi()).put(`/bank-reconciliation/${id}`, data),
  reconcile: async (id: string) => (await getApi()).post(`/bank-reconciliation/${id}/reconcile`),
};

// ============================================================================
// TAX MANAGEMENT API
// ============================================================================
export const taxManagementAPI = {
  getTaxSettings: async () => (await getApi()).get('/tax-management/settings'),
  getTaxLiabilities: async (params?: any) => (await getApi()).get('/tax-management/liabilities', { params }),
  getGSTReturns: async (params?: any) => (await getApi()).get('/tax-management/gst-returns', { params }),
  getById: async (id: string) => (await getApi()).get(`/tax-management/${id}`),
  create: async (data: any) => (await getApi()).post('/tax-management', data),
  update: async (id: string, data: any) => (await getApi()).put(`/tax-management/${id}`, data),
  updateTaxSettings: async (data: any) => (await getApi()).put('/tax-management/settings', data),
  delete: async (id: string) => (await getApi()).delete(`/tax-management/${id}`),
  fileGSTReturn: async (data: any) => (await getApi()).post('/tax-management/gst-returns', data),
  calculateTDS: async (amount: number, rate: number) => (await getApi()).post('/tax-management/calculate-tds', { amount, rate }),
  calculateIncomeTax: async (income: number, deductions?: number) => (await getApi()).post('/tax-management/calculate-income-tax', { income, deductions }),
};

// ============================================================================
// AGING ANALYSIS API (existing)
// ============================================================================
export const agingAnalysisAPI = {
  getReceivables: async (params?: any) => (await getApi()).get('/aging-analysis/receivables', { params }),
  getPayables: async (params?: any) => (await getApi()).get('/aging-analysis/payables', { params }),
  getSummary: async () => (await getApi()).get('/aging-analysis/summary'),
  exportReport: async (type: 'receivables' | 'payables') => (await getApi()).get(`/aging-analysis/export/${type}`, { responseType: 'blob' }),
};
