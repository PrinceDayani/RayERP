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
  tags?: { name: string; color: string }[];
  timeEntries?: Array<{
    user: string;
    startTime: string;
    endTime?: string;
    duration: number;
    description?: string;
  }>;
  attachments?: Array<{
    _id?: string;
    filename: string;
    originalName: string;
    mimetype: string;
    size: number;
    url: string;
    uploadedBy: string;
    uploadedAt: string;
  }>;
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

  // Get tasks by project
  getTasksByProject: async (projectId: string) => {
    const response = await api.get(`/projects/${projectId}/tasks`);
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
    try {
      // Validate status before sending
      const validStatuses = ['todo', 'in-progress', 'review', 'completed', 'blocked'];
      if (!validStatuses.includes(status)) {
        throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
      }
      
      // Get user from localStorage if not provided
      let userId = user;
      if (!userId) {
        try {
          const token = localStorage.getItem('auth-token');
          if (token) {
            const payload = JSON.parse(atob(token.split('.')[1]));
            userId = payload.employeeId || payload.id || payload._id;
          }
        } catch (error) {
          console.warn('Could not extract user from token:', error);
        }
      }
      
      const payload = { status, user: userId };
      const response = await api.patch(`/tasks/${id}/status`, payload);
      return response.data;
    } catch (error: any) {
      console.error('Error updating task status:', {
        id,
        status,
        error: error?.response?.data || error?.message
      });
      throw error;
    }
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
  },

  // Time tracking
  startTimer: async (id: string, user: string, description?: string) => {
    const response = await api.post(`/tasks/${id}/time/start`, { user, description });
    return response.data;
  },

  stopTimer: async (id: string, user: string) => {
    const response = await api.post(`/tasks/${id}/time/stop`, { user });
    return response.data;
  },

  // Attachments
  addAttachment: async (id: string, data: { filename: string; originalName: string; mimetype: string; size: number; url: string; uploadedBy: string }) => {
    const response = await api.post(`/tasks/${id}/attachments`, data);
    return response.data;
  },

  removeAttachment: async (id: string, attachmentId: string) => {
    const response = await api.delete(`/tasks/${id}/attachments/${attachmentId}`);
    return response.data;
  },

  // Tags
  addTag: async (id: string, name: string, color?: string) => {
    const response = await api.post(`/tasks/${id}/tags`, { name, color });
    return response.data;
  },

  removeTag: async (id: string, name: string) => {
    const response = await api.delete(`/tasks/${id}/tags`, { data: { name } });
    return response.data;
  },

  // Subtasks & Checklist
  addSubtask: async (id: string, data: { title: string; description: string; assignedTo: string; assignedBy: string }) => {
    const response = await api.post(`/tasks/${id}/subtasks`, data);
    return response.data;
  },

  addChecklistItem: async (id: string, text: string) => {
    const response = await api.post(`/tasks/${id}/checklist`, { text });
    return response.data;
  },

  updateChecklistItem: async (id: string, itemId: string, completed: boolean, completedBy?: string) => {
    const response = await api.patch(`/tasks/${id}/checklist`, { itemId, completed, completedBy });
    return response.data;
  },

  deleteChecklistItem: async (id: string, itemId: string) => {
    const response = await api.delete(`/tasks/${id}/checklist/${itemId}`);
    return response.data;
  },

  getSubtaskProgress: async (id: string) => {
    const response = await api.get(`/tasks/${id}/subtasks/progress`);
    return response.data;
  },

  // Recurring
  setRecurring: async (id: string, pattern: string, enabled: boolean) => {
    const response = await api.post(`/tasks/${id}/recurring`, { pattern, enabled });
    return response.data;
  },

  // Dependencies
  addDependency: async (id: string, dependsOn: string, type?: string) => {
    const response = await api.post(`/tasks/${id}/dependencies`, { dependsOn, type });
    return response.data;
  },

  removeDependency: async (id: string, dependencyId: string) => {
    const response = await api.delete(`/tasks/${id}/dependencies/${dependencyId}`);
    return response.data;
  },

  getDependencyGraph: async (projectId?: string) => {
    const params = projectId ? `?projectId=${projectId}` : '';
    const response = await api.get(`/tasks/dependencies/graph${params}`);
    return response.data;
  },

  getCriticalPath: async (projectId: string) => {
    const response = await api.get(`/tasks/dependencies/critical-path?projectId=${projectId}`);
    return response.data;
  },

  checkBlocked: async (id: string) => {
    const response = await api.get(`/tasks/${id}/dependencies/blocked`);
    return response.data;
  },

  // Search
  search: async (filters: any, page = 1, limit = 20) => {
    const params = new URLSearchParams({ ...filters, page: page.toString(), limit: limit.toString() });
    const response = await api.get(`/tasks/search?${params}`);
    return response.data;
  },

  saveSearch: async (name: string, filters: any) => {
    const response = await api.post('/tasks/search/saved', { name, filters });
    return response.data;
  },

  getSavedSearches: async () => {
    const response = await api.get('/tasks/search/saved');
    return response.data;
  },

  deleteSavedSearch: async (id: string) => {
    const response = await api.delete(`/tasks/search/saved/${id}`);
    return response.data;
  }
};



export default tasksAPI;