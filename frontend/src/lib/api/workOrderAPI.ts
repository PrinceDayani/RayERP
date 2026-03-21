import api from './api';
import {
  IWorkOrder,
  IWorkOrderAnalytics,
  CreateWorkOrderRequest,
  RecordWOPaymentRequest
} from '@/types/workOrder';

export const workOrderApi = {
  create: async (data: CreateWorkOrderRequest): Promise<{ workOrder: IWorkOrder }> => {
    const response = await api.post('/work-orders', data);
    return response.data;
  },

  getByProject: async (
    projectId: string,
    params?: { status?: string }
  ): Promise<{ workOrders: IWorkOrder[] }> => {
    const response = await api.get(`/work-orders/project/${projectId}`, { params });
    return response.data;
  },

  getById: async (id: string): Promise<{ workOrder: IWorkOrder }> => {
    const response = await api.get(`/work-orders/${id}`);
    return response.data;
  },

  update: async (id: string, data: Partial<IWorkOrder>): Promise<{ workOrder: IWorkOrder }> => {
    const response = await api.put(`/work-orders/${id}`, data);
    return response.data;
  },

  submitForApproval: async (id: string): Promise<{ workOrder: IWorkOrder }> => {
    const response = await api.post(`/work-orders/${id}/submit`);
    return response.data;
  },

  approve: async (id: string): Promise<{ workOrder: IWorkOrder }> => {
    const response = await api.post(`/work-orders/${id}/approve`);
    return response.data;
  },

  reject: async (id: string, data: { rejectionReason: string }): Promise<{ workOrder: IWorkOrder }> => {
    const response = await api.post(`/work-orders/${id}/reject`, data);
    return response.data;
  },

  issue: async (id: string): Promise<{ workOrder: IWorkOrder }> => {
    const response = await api.post(`/work-orders/${id}/issue`);
    return response.data;
  },

  updateStatus: async (id: string, status: string): Promise<{ workOrder: IWorkOrder }> => {
    const response = await api.patch(`/work-orders/${id}/status`, { status });
    return response.data;
  },

  recordPayment: async (id: string, data: RecordWOPaymentRequest): Promise<{ workOrder: IWorkOrder }> => {
    const response = await api.post(`/work-orders/${id}/payments`, data);
    return response.data;
  },

  getAnalytics: async (projectId: string): Promise<{ analytics: IWorkOrderAnalytics }> => {
    const response = await api.get(`/work-orders/project/${projectId}/analytics`);
    return response.data;
  }
};
