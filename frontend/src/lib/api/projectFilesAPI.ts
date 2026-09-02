//path: frontend/src/lib/api/projectFilesAPI.ts

import api from './api';
import { unwrapResponse } from './unwrap';

export const PROJECT_FILE_CATEGORIES = [
  'drawing',
  'final-drawing',
  'as-built',
  'certificate',
  'report',
  'contract',
  'photo',
  'other'
] as const;

export type ProjectFileCategory = (typeof PROJECT_FILE_CATEGORIES)[number];

export const PROJECT_FILE_CATEGORY_LABELS: Record<ProjectFileCategory, string> = {
  'drawing': 'Drawing',
  'final-drawing': 'Final drawing',
  'as-built': 'As-built',
  'certificate': 'Certificate',
  'report': 'Report',
  'contract': 'Contract',
  'photo': 'Photo',
  'other': 'Other'
};

export interface ProjectFile {
  _id: string;
  name: string;
  originalName: string;
  path: string;
  size: number;
  mimeType: string;
  project: string;
  // Document register entry
  category: ProjectFileCategory;
  documentNumber?: string;
  revision?: string;
  phase?: { _id: string; name: string; order: number } | string;
  issuedDate?: string;
  approvalStatus: 'draft' | 'pending' | 'approved' | 'rejected';
  approvedBy?: { _id: string; name: string; email: string } | string;
  approvedAt?: string;
  uploadedBy: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ProjectFileMetadataUpdate {
  category?: ProjectFileCategory;
  documentNumber?: string;
  revision?: string;
  phase?: string | null;
  issuedDate?: string | null;
  approvalStatus?: ProjectFile['approvalStatus'];
}

export const projectFilesAPI = {
  // Pass a category to read one slice of the register, e.g. only certificates.
  getByProject: async (projectId: string, category?: ProjectFileCategory) => {
    const response = await api.get(`/projects/${projectId}/files`, {
      params: category ? { category } : undefined
    });
    return unwrapResponse(response.data);
  },

  upload: async (projectId: string, formData: FormData) => {
    const response = await api.post(`/projects/${projectId}/files`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return unwrapResponse(response.data);
  },

  // Edit the register entry: category, drawing number, revision, approval.
  updateMetadata: async (
    projectId: string,
    fileId: string,
    metadata: ProjectFileMetadataUpdate
  ) => {
    const response = await api.put(`/projects/${projectId}/files/${fileId}`, metadata);
    return unwrapResponse(response.data);
  },

  download: async (projectId: string, fileId: string) => {
    const response = await api.get(`/projects/${projectId}/files/${fileId}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },

  delete: async (projectId: string, fileId: string) => {
    const response = await api.delete(`/projects/${projectId}/files/${fileId}`);
    return unwrapResponse(response.data);
  },
};

export default projectFilesAPI;
