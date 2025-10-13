//path: frontend/src/lib/api/projectActivityAPI.ts

import api from './api';

export interface ActivityItem {
  _id: string;
  type: 'task_created' | 'task_updated' | 'task_completed' | 'file_uploaded' | 'comment_added' | 'project_updated';
  title: string;
  description: string;
  user: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  project: string;
  metadata?: {
    taskId?: string;
    taskName?: string;
    fileId?: string;
    fileName?: string;
    oldStatus?: string;
    newStatus?: string;
  };
  createdAt: string;
}

export const projectActivityAPI = {
  getByProject: async (projectId: string, type?: string) => {
    const params = type ? { type } : {};
    const response = await api.get(`/projects/${projectId}/activity`, { params });
    return response.data;
  },

  create: async (activityData: Omit<ActivityItem, '_id' | 'createdAt'>) => {
    const response = await api.post('/activity', activityData);
    return response.data;
  },
};

export default projectActivityAPI;