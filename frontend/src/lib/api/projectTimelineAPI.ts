//path: frontend/src/lib/api/projectTimelineAPI.ts

import api from './api';

export interface TimelineEvent {
  _id: string;
  title: string;
  description: string;
  date: string;
  type: 'milestone' | 'task' | 'meeting' | 'deadline';
  status: 'completed' | 'in-progress' | 'upcoming' | 'overdue';
  project: string;
  createdBy: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  updatedAt: string;
}

export const projectTimelineAPI = {
  getByProject: async (projectId: string) => {
    const response = await api.get(`/projects/${projectId}/timeline`);
    return response.data;
  },

  create: async (timelineData: Omit<TimelineEvent, '_id' | 'createdAt' | 'updatedAt'>) => {
    const response = await api.post('/timeline', timelineData);
    return response.data;
  },

  update: async (id: string, timelineData: Partial<TimelineEvent>) => {
    const response = await api.put(`/timeline/${id}`, timelineData);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/timeline/${id}`);
    return response.data;
  },
};

export default projectTimelineAPI;
