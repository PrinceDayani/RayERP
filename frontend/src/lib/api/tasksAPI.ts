//path: frontend/src/lib/api/tasksAPI.ts

import api from './api';

export interface Task {
  _id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'review' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  project: {
    _id: string;
    name: string;
  };
  assignedTo: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  assignedBy: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  dueDate: string;
  estimatedHours?: number;
  actualHours?: number;
  tags?: string[];
  comments: Array<{
    user: {
      _id: string;
      firstName: string;
      lastName: string;
    };
    comment: string;
    createdAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskData {
  title: string;
  description: string;
  project: string;
  assignedTo: string;
  assignedBy: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  dueDate?: string;
  estimatedHours?: number;
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  assignedTo?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  dueDate?: string;
  estimatedHours?: number;
  updatedBy?: string;
}



export const tasksAPI = {
  // Get all tasks
  getAll: async () => {
    const response = await api.get('/tasks');
    return response.data;
  },

  // Get task by ID
  getById: async (id: string) => {
    const response = await api.get(`/tasks/${id}`);
    return response.data;
  },

  // Create new task
  create: async (taskData: CreateTaskData) => {
    const response = await api.post('/tasks', taskData);
    return response.data;
  },

  // Update task
  update: async (id: string, taskData: UpdateTaskData) => {
    const response = await api.put(`/tasks/${id}`, taskData);
    return response.data;
  },

  // Delete task
  delete: async (id: string) => {
    const response = await api.delete(`/tasks/${id}`);
    return response.data;
  },

  // Update task status
  updateStatus: async (id: string, status: string, user?: string) => {
    const response = await api.patch(`/tasks/${id}/status`, { status, user });
    return response.data;
  },

  // Add comment to task
  addComment: async (id: string, comment: string, user: string) => {
    const response = await api.post(`/tasks/${id}/comments`, { comment, user });
    return response.data;
  },

  // Get task timeline
  getTimeline: async (id: string) => {
    const response = await api.get(`/tasks/${id}/timeline`);
    return response.data;
  },

  // Get task stats
  getStats: async () => {
    const response = await api.get('/tasks/stats');
    return response.data;
  }
};



export default tasksAPI;