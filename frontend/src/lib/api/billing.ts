import api from './api';
import {
  IMilestoneBilling,
  IBillingAnalytics,
  CreateMilestoneBillingRequest,
  UpdateBillingRequest,
  GenerateInvoiceRequest,
  RecordPaymentRequest,
  RejectBillingRequest,
  IPaymentSchedule
} from '@/types/billing';

export const billingApi = {
  // Get all billings (common view)
  getAllBillings: async (
    params?: { status?: string; approvalStatus?: string; projectId?: string; page?: number; limit?: number }
  ): Promise<{ billings: IMilestoneBilling[]; pagination: { total: number; page: number; limit: number; pages: number } }> => {
    const response = await api.get('/billing/all', { params });
    return response.data;
  },

  // Create milestone billing
  createMilestoneBilling: async (
    data: CreateMilestoneBillingRequest
  ): Promise<{ billing: IMilestoneBilling }> => {
    const response = await api.post('/billing', data);
    return response.data;
  },

  // Get billings by project
  getBillingsByProject: async (
    projectId: string,
    params?: { status?: string; approvalStatus?: string; page?: number; limit?: number }
  ): Promise<{ billings: IMilestoneBilling[]; pagination: { total: number; page: number; limit: number; pages: number } }> => {
    const response = await api.get(`/billing/project/${projectId}`, { params });
    return response.data;
  },

  // Get billing by ID
  getBillingById: async (id: string): Promise<{ billing: IMilestoneBilling }> => {
    const response = await api.get(`/billing/${id}`);
    return response.data;
  },

  // Update billing
  updateBilling: async (
    id: string,
    data: UpdateBillingRequest
  ): Promise<{ billing: IMilestoneBilling }> => {
    const response = await api.put(`/billing/${id}`, data);
    return response.data;
  },

  // Submit for approval
  submitForApproval: async (id: string): Promise<{ billing: IMilestoneBilling }> => {
    const response = await api.post(`/billing/${id}/submit`);
    return response.data;
  },

  // Approve billing
  approveBilling: async (id: string): Promise<{ billing: IMilestoneBilling }> => {
    const response = await api.post(`/billing/${id}/approve`);
    return response.data;
  },

  // Reject billing
  rejectBilling: async (
    id: string,
    data: RejectBillingRequest
  ): Promise<{ billing: IMilestoneBilling }> => {
    const response = await api.post(`/billing/${id}/reject`, data);
    return response.data;
  },

  // Generate invoice
  generateInvoice: async (
    id: string,
    data: GenerateInvoiceRequest
  ): Promise<{ billing: IMilestoneBilling }> => {
    const response = await api.post(`/billing/${id}/invoice`, data);
    return response.data;
  },

  // Record payment
  recordPayment: async (
    id: string,
    data: RecordPaymentRequest
  ): Promise<{ billing: IMilestoneBilling }> => {
    const response = await api.post(`/billing/${id}/payment`, data);
    return response.data;
  },

  // Add payment schedule
  addPaymentSchedule: async (
    id: string,
    data: Partial<IPaymentSchedule>
  ): Promise<{ billing: IMilestoneBilling }> => {
    const response = await api.post(`/billing/${id}/schedules`, data);
    return response.data;
  },

  // Update payment schedule
  updatePaymentSchedule: async (
    id: string,
    scheduleId: string,
    data: Partial<IPaymentSchedule>
  ): Promise<{ billing: IMilestoneBilling }> => {
    const response = await api.put(`/billing/${id}/schedules/${scheduleId}`, data);
    return response.data;
  },

  // Get billing analytics
  getBillingAnalytics: async (projectId: string): Promise<{ analytics: IBillingAnalytics }> => {
    const response = await api.get(`/billing/project/${projectId}/analytics`);
    return response.data;
  },

  // Reconcile payment
  reconcilePayment: async (id: string, paymentId: string): Promise<{ billing: IMilestoneBilling }> => {
    const response = await api.post(`/billing/${id}/payment/${paymentId}/reconcile`);
    return response.data;
  },

  // Get audit trail
  getAuditTrail: async (
    id: string,
    params?: { page?: number; limit?: number }
  ): Promise<{ auditTrail: any[]; pagination: { total: number; page: number; limit: number; pages: number } }> => {
    const response = await api.get(`/billing/${id}/audit-trail`, { params });
    return response.data;
  }
};
