//path: frontend/src/lib/api/projectTemplateAPI.ts

import api from './api';

export const projectTemplateAPI = {
  getTemplates: async (category?: string, isPublic?: boolean) => {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (isPublic !== undefined) params.append('isPublic', String(isPublic));
    const response = await api.get(`/project-templates?${params}`);
    return response.data;
  },

  createTemplate: async (data: any) => {
    const response = await api.post('/project-templates', data);
    return response.data;
  },

  createProjectFromTemplate: async (templateId: string, data: any) => {
    const response = await api.post(`/project-templates/${templateId}/create-project`, data);
    return response.data;
  },

  cloneProject: async (projectId: string, data: any) => {
    const response = await api.post(`/projects/${projectId}/clone`, data);
    return response.data;
  },

  exportProjectAsTemplate: async (projectId: string) => {
    const response = await api.get(`/projects/${projectId}/export-template`);
    return response.data;
  }
};
