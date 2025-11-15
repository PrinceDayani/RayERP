import api from './api';

const BASE_URL = '/allocation-rules';

export const allocationRuleAPI = {
  getAll: async () => {
    const response = await api.get(BASE_URL);
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`${BASE_URL}/${id}`);
    return response.data;
  },

  create: async (data: any) => {
    const response = await api.post(BASE_URL, data);
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await api.put(`${BASE_URL}/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`${BASE_URL}/${id}`);
    return response.data;
  },

  activate: async (id: string) => {
    const response = await api.post(`${BASE_URL}/${id}/activate`);
    return response.data;
  },

  deactivate: async (id: string) => {
    const response = await api.post(`${BASE_URL}/${id}/deactivate`);
    return response.data;
  }
};

export default allocationRuleAPI;
