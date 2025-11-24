//path: frontend/src/lib/api/projectFilesAPI.ts

import api from './api';

export interface ProjectFile {
  _id: string;
  name: string;
  originalName: string;
  path: string;
  size: number;
  mimeType: string;
  project: string;
  uploadedBy: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  updatedAt: string;
}

export const projectFilesAPI = {
  getByProject: async (projectId: string) => {
    const response = await api.get(`/projects/${projectId}/files`);
    return response.data;
  },

  upload: async (projectId: string, formData: FormData) => {
    const response = await api.post(`/projects/${projectId}/files`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  download: async (projectId: string, fileId: string) => {
    const response = await api.get(`/projects/${projectId}/files/${fileId}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },

  delete: async (projectId: string, fileId: string) => {
    const response = await api.delete(`/projects/${projectId}/files/${fileId}`);
    return response.data;
  },
};

export default projectFilesAPI;
