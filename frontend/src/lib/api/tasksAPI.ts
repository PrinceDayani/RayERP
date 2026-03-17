//path: frontend/src/lib/api/tasksAPI.ts

import api from './api';

export interface Task {
  _id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'review' | 'completed' | 'blocked';
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
  assignee?: {
    _id: string;
    name?: string;
    firstName?: string;
    lastName?: string;
  };
  assignedBy: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  dueDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  isRecurring?: boolean;
  recurrencePattern?: string;
  nextRecurrence?: string;
  tags?: string[] | { name: string; color: string }[];
  checklist?: Array<{ _id: string; text: string; completed: boolean }>;
  subtasks?: Array<{ _id: string; title: string; status: string }>;
  dependencies?: Array<{ _id: string; taskId: { _id: string; title: string }; type: string }>;
  watchers?: Array<{ _id: string; firstName: string; lastName: string }>;
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
  status?: 'todo' | 'in-progress' | 'review' | 'completed';
  assignedTo?: string;
  assignedBy?: string;
  project?: string;
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

  // Edit task
  edit: async (id: string, taskData: UpdateTaskData) => {
    const response = await api.put(`/tasks/${id}`, taskData);
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

  // View all tasks
  viewAll: async () => {
    const response = await api.get('/tasks');
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

  // Get task templates
  getTaskTemplates: async () => {
    const response = await api.get('/tasks/templates');
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
  uploadAttachment: async (id: string, formData: FormData) => {
    const response = await api.post(`/tasks/${id}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  deleteAttachment: async (id: string, attachmentId: string) => {
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
  },

  // Recurring (server-side filter)
  getRecurring: async () => {
    const response = await api.get('/tasks?isRecurring=true');
    return response.data;
  },

  // Clone
  clone: async (id: string) => {
    const response = await api.post(`/tasks/${id}/clone`);
    return response.data;
  },

  // Watchers
  addWatcher: async (id: string, userId: string) => {
    const response = await api.post(`/tasks/${id}/watchers`, { userId });
    return response.data;
  },

  removeWatcher: async (id: string, userId: string) => {
    const response = await api.delete(`/tasks/${id}/watchers/${userId}`);
    return response.data;
  },

  // Custom Fields
  addCustomField: async (id: string, field: { fieldName: string; fieldType: string; value: any; options?: string[] }) => {
    const response = await api.post(`/tasks/${id}/custom-fields`, field);
    return response.data;
  },

  removeCustomField: async (id: string, fieldName: string) => {
    const response = await api.delete(`/tasks/${id}/custom-fields/${fieldName}`);
    return response.data;
  },

  updateCustomField: async (id: string, fieldName: string, value: any) => {
    const response = await api.patch(`/tasks/${id}/custom-fields/${fieldName}`, { value });
    return response.data;
  },

  // Bulk Operations
  bulkUpdate: async (taskIds: string[], updates: any) => {
    const response = await api.patch('/tasks/bulk', { taskIds, updates });
    return response.data;
  },

  // Templates
  getTemplates: async () => {
    const response = await api.get('/tasks/templates/all');
    return response.data;
  },

  createFromTemplate: async (templateId: string, data?: any) => {
    const response = await api.post(`/tasks/templates/${templateId}/create`, data);
    return response.data;
  },

  saveAsTemplate: async (id: string, templateName: string) => {
    const response = await api.post(`/tasks/${id}/templates/save`, { templateName });
    return response.data;
  },

  updateTemplate: async (id: string, data: any) => {
    const response = await api.put(`/tasks/templates/${id}`, data);
    return response.data;
  },

  deleteTemplate: async (id: string) => {
    const response = await api.delete(`/tasks/templates/${id}`);
    return response.data;
  },

  // Advanced Search
  advancedSearch: async (filters: any) => {
    const response = await api.get('/tasks/search', { params: filters });
    return response.data;
  },

  getSearchSuggestions: async (query: string) => {
    const response = await api.get('/tasks/search/suggestions', { params: { query } });
    return response.data;
  },

  // Calendar & Timeline
  getCalendarView: async (startDate: string, endDate: string) => {
    const response = await api.get('/tasks/calendar/view', { params: { startDate, endDate } });
    return response.data;
  },

  getTimelineView: async (projectId?: string) => {
    const params = projectId ? { projectId } : {};
    const response = await api.get('/tasks/calendar/timeline', { params });
    return response.data;
  },

  exportICalendar: async (taskIds?: string[]) => {
    const params = taskIds ? { taskIds: taskIds.join(',') } : {};
    const response = await api.get('/tasks/calendar/export', { params, responseType: 'blob' });
    return response.data;
  },

  syncGoogleCalendar: async (accessToken: string, calendarId: string) => {
    const response = await api.post('/tasks/calendar/sync/google', { accessToken, calendarId });
    return response.data;
  },

  // Subtask operations
  deleteSubtask: async (id: string, subtaskId: string) => {
    const response = await api.delete(`/tasks/${id}/subtasks/${subtaskId}`);
    return response.data;
  },

  // Analytics
  getAnalytics: async (projectId?: string, userId?: string, startDate?: string, endDate?: string) => {
    const params: any = {};
    if (projectId) params.projectId = projectId;
    if (userId) params.userId = userId;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const response = await api.get('/tasks/analytics', { params });
    return response.data;
  },

  getProductivityMetrics: async (userId: string, startDate?: string, endDate?: string) => {
    const params: any = { userId };
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const response = await api.get('/tasks/analytics/productivity', { params });
    return response.data;
  },

  getProjectAnalytics: async (projectId: string) => {
    const response = await api.get('/tasks/analytics/project', { params: { projectId } });
    return response.data;
  },

  getVelocity: async (projectId?: string) => {
    const params = projectId ? { projectId } : {};
    const response = await api.get('/tasks/analytics/velocity', { params });
    return response.data;
  },

  getTeamPerformance: async (projectId?: string) => {
    const params = projectId ? { projectId } : {};
    const response = await api.get('/tasks/analytics/team-performance', { params });
    return response.data;
  },

  // Gantt Chart
  getGanttData: async (projectId: string) => {
    const response = await api.get('/tasks/gantt', { params: { projectId } });
    return response.data;
  },

  updateGanttTask: async (id: string, data: { start_date?: string; end_date?: string; progress?: number }) => {
    const response = await api.patch(`/tasks/gantt/${id}`, data);
    return response.data;
  },

  // Bulk Operations
  bulkDelete: async (taskIds: string[]) => {
    const response = await api.delete('/tasks/bulk/delete', { data: { taskIds } });
    return response.data;
  },

  bulkAssign: async (taskIds: string[], assignedTo: string) => {
    const response = await api.patch('/tasks/bulk/assign', { taskIds, assignedTo });
    return response.data;
  },

  bulkStatusChange: async (taskIds: string[], status: string) => {
    const response = await api.patch('/tasks/bulk/status', { taskIds, status });
    return response.data;
  },

  bulkPriorityChange: async (taskIds: string[], priority: string) => {
    const response = await api.patch('/tasks/bulk/priority', { taskIds, priority });
    return response.data;
  },

  bulkAddTags: async (taskIds: string[], tags: Array<{ name: string; color: string }>) => {
    const response = await api.patch('/tasks/bulk/tags', { taskIds, tags });
    return response.data;
  },

  bulkSetDueDate: async (taskIds: string[], dueDate: string) => {
    const response = await api.patch('/tasks/bulk/due-date', { taskIds, dueDate });
    return response.data;
  },

  bulkClone: async (taskIds: string[]) => {
    const response = await api.post('/tasks/bulk/clone', { taskIds });
    return response.data;
  },

  bulkArchive: async (taskIds: string[]) => {
    const response = await api.patch('/tasks/bulk/archive', { taskIds });
    return response.data;
  }
};



export default tasksAPI;
