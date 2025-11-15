import api from './api';

const BASE_URL = '/journal-templates';

export const journalTemplateAPI = {
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

  getByCategory: async (category: string) => {
    const response = await api.get(`${BASE_URL}/category/${category}`);
    return response.data;
  }
};

export default journalTemplateAPI;
