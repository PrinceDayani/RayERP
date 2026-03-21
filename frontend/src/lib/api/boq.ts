import api from './api';
import {
  IBOQ,
  CreateBOQRequest,
  UpdateBOQItemRequest,
  AddBOQItemRequest,
  IVarianceAnalysis,
  ICostForecast,
  ICategoryBreakdown
} from '@/types/boq';

export const boqApi = {
  // Create BOQ
  createBOQ: async (data: CreateBOQRequest): Promise<{ boq: IBOQ }> => {
    const response = await api.post('/boq', data);
    return response.data;
  },

  // Get BOQs by project
  getBOQsByProject: async (
    projectId: string,
    params?: { status?: string; version?: number }
  ): Promise<{ boqs: IBOQ[] }> => {
    const response = await api.get(`/boq/project/${projectId}`, { params });
    return response.data;
  },

  // Get BOQ by ID
  getBOQById: async (id: string): Promise<{ boq: IBOQ }> => {
    const response = await api.get(`/boq/${id}`);
    return response.data;
  },

  // Update BOQ item
  updateBOQItem: async (
    boqId: string,
    itemId: string,
    data: UpdateBOQItemRequest
  ): Promise<{ boq: IBOQ }> => {
    const response = await api.put(`/boq/${boqId}/items/${itemId}`, data);
    return response.data;
  },

  // Add BOQ item
  addBOQItem: async (
    boqId: string,
    data: AddBOQItemRequest
  ): Promise<{ boq: IBOQ }> => {
    const response = await api.post(`/boq/${boqId}/items`, data);
    return response.data;
  },

  // Delete BOQ item
  deleteBOQItem: async (boqId: string, itemId: string): Promise<{ boq: IBOQ }> => {
    const response = await api.delete(`/boq/${boqId}/items/${itemId}`);
    return response.data;
  },

  // Approve BOQ
  approveBOQ: async (id: string): Promise<{ boq: IBOQ }> => {
    const response = await api.post(`/boq/${id}/approve`);
    return response.data;
  },

  // Activate BOQ
  activateBOQ: async (id: string): Promise<{ boq: IBOQ }> => {
    const response = await api.post(`/boq/${id}/activate`);
    return response.data;
  },

  // Get variance analysis
  getVarianceAnalysis: async (id: string): Promise<{ analysis: IVarianceAnalysis[] }> => {
    const response = await api.get(`/boq/${id}/variance`);
    return response.data;
  },

  // Get cost forecast
  getCostForecast: async (id: string): Promise<{ forecast: ICostForecast }> => {
    const response = await api.get(`/boq/${id}/forecast`);
    return response.data;
  },

  // Get milestone progress
  getMilestoneProgress: async (
    id: string,
    milestoneId: string
  ): Promise<{ milestoneId: string; progress: number }> => {
    const response = await api.get(`/boq/${id}/milestone/${milestoneId}/progress`);
    return response.data;
  },

  // Get category breakdown
  getCategoryBreakdown: async (id: string): Promise<{ breakdown: ICategoryBreakdown[] }> => {
    const response = await api.get(`/boq/${id}/category-breakdown`);
    return response.data;
  }
};
