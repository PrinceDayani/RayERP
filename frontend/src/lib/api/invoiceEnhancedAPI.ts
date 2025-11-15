import api from './api';

const BASE_URL = '/invoices-enhanced';

export const invoiceEnhancedAPI = {
  // Recurring Invoices
  generateRecurring: async () => {
    const response = await api.post(`${BASE_URL}/recurring/generate`);
    return response.data;
  },

  // Partial Payments
  addPayment: async (invoiceId: string, data: { amount: number; method: string; reference?: string; notes?: string }) => {
    const response = await api.post(`${BASE_URL}/${invoiceId}/payments`, data);
    return response.data;
  },

  // Aging Report
  getAgingReport: async () => {
    const response = await api.get(`${BASE_URL}/reports/aging`);
    return response.data;
  },

  // Voucher Integration
  createVoucher: async (invoiceId: string) => {
    const response = await api.post(`${BASE_URL}/${invoiceId}/create-voucher`);
    return response.data;
  },

  // E-Invoice
  generateEInvoice: async (invoiceId: string) => {
    const response = await api.post(`${BASE_URL}/${invoiceId}/e-invoice`);
    return response.data;
  },

  // Proforma Conversion
  convertToInvoice: async (proformaId: string) => {
    const response = await api.post(`${BASE_URL}/${proformaId}/convert-to-invoice`);
    return response.data;
  },

  // Email
  emailInvoice: async (invoiceId: string) => {
    const response = await api.post(`${BASE_URL}/${invoiceId}/email`);
    return response.data;
  },

  sendReminder: async (invoiceId: string) => {
    const response = await api.post(`${BASE_URL}/${invoiceId}/reminder`);
    return response.data;
  },

  // Disputes
  disputeInvoice: async (invoiceId: string, data: { reason: string; amount: number }) => {
    const response = await api.post(`${BASE_URL}/${invoiceId}/dispute`, data);
    return response.data;
  },

  // Approval
  approveInvoice: async (invoiceId: string) => {
    const response = await api.post(`${BASE_URL}/${invoiceId}/approve`);
    return response.data;
  }
};

export default invoiceEnhancedAPI;
