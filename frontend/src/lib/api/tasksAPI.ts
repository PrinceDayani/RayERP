//path: frontend/src/lib/api/tasksAPI.ts

import api from './api';
import { unwrapResponse } from './unwrap';

export interface Task {
  _id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'review' | 'completed' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'critical';
  taskType?: 'individual' | 'project';
  assignmentType?: 'self-assigned' | 'manager-assigned';
  project?: {
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
  watchers?: Array<{ _id: string; name: string; email?: string }>;
  parentTask?: string | { _id: string; title: string };
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
  project?: string;
  assignedTo: string;
  assignedBy?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status?: 'todo' | 'in-progress' | 'review' | 'completed' | 'blocked';
  dueDate?: string;
  estimatedHours?: number;
  taskType?: 'individual' | 'project';
  assignmentType?: 'self-assigned' | 'manager-assigned';
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
  // Without paging params the API returns a bare array, so existing callers
  // are unaffected. Pass filters to have the server do the work.
  getAll: async (params: Record<string, any> = {}) => {
    const response = await api.get('/tasks', { params });
    return unwrapResponse(response.data);
  },

  // Id/title pairs for dropdowns.
  getMinimal: async (projectId?: string) => {
    const response = await api.get('/tasks/minimal', {
      params: projectId ? { project: projectId } : {}
    });
    return unwrapResponse(response.data);
  },

  // Get tasks by project
  getTasksByProject: async (projectId: string) => {
    const response = await api.get(`/projects/${projectId}/tasks`);
    return unwrapResponse(response.data);
  },

  // Get task by ID
  getById: async (id: string) => {
    const response = await api.get(`/tasks/${id}`);
    return unwrapResponse(response.data);
  },

  // Create new task
  create: async (taskData: CreateTaskData) => {
    const response = await api.post('/tasks', taskData);
    return unwrapResponse(response.data);
  },

  // Edit task
  edit: async (id: string, taskData: UpdateTaskData) => {
    const response = await api.put(`/tasks/${id}`, taskData);
    return unwrapResponse(response.data);
  },

  // Update task
  update: async (id: string, taskData: UpdateTaskData) => {
    const response = await api.put(`/tasks/${id}`, taskData);
    return unwrapResponse(response.data);
  },

  // Delete task
  delete: async (id: string) => {
    const response = await api.delete(`/tasks/${id}`);
    return unwrapResponse(response.data);
  },

  // View all tasks
  viewAll: async () => {
    const response = await api.get('/tasks');
    return unwrapResponse(response.data);
  },

  // Update task status. The actor is taken from the authenticated session
  // server-side, so no user id is sent.
  updateStatus: async (id: string, status: string) => {
    const validStatuses = ['todo', 'in-progress', 'review', 'completed', 'blocked'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    const response = await api.patch(`/tasks/${id}/status`, { status });
    return unwrapResponse(response.data);
  },

  // Add comment to task
  addComment: async (id: string, comment: string) => {
    const response = await api.post(`/tasks/${id}/comments`, { comment });
    return unwrapResponse(response.data);
  },

  // Get task timeline
  getTimeline: async (id: string) => {
    const response = await api.get(`/tasks/${id}/timeline`);
    return unwrapResponse(response.data);
  },

  // Get task stats
  getStats: async () => {
    const response = await api.get('/tasks/stats');
    return unwrapResponse(response.data);
  },

  // Get task templates
  getTaskTemplates: async () => {
    const response = await api.get('/tasks/templates');
    return unwrapResponse(response.data);
  },

  // Time tracking
  startTimer: async (id: string, description?: string) => {
    const response = await api.post(`/tasks/${id}/time/start`, { description });
    return unwrapResponse(response.data);
  },

  stopTimer: async (id: string) => {
    const response = await api.post(`/tasks/${id}/time/stop`, {});
    return unwrapResponse(response.data);
  },

  // Attachments
  uploadAttachment: async (id: string, formData: FormData) => {
    const response = await api.post(`/tasks/${id}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return unwrapResponse(response.data);
  },

  deleteAttachment: async (id: string, attachmentId: string) => {
    const response = await api.delete(`/tasks/${id}/attachments/${attachmentId}`);
    return unwrapResponse(response.data);
  },

  // Alias for deleteAttachment
  removeAttachment: async (id: string, attachmentId: string) => {
    const response = await api.delete(`/tasks/${id}/attachments/${attachmentId}`);
    return unwrapResponse(response.data);
  },

  // Tags
  addTag: async (id: string, name: string, color?: string) => {
    const response = await api.post(`/tasks/${id}/tags`, { name, color });
    return unwrapResponse(response.data);
  },

  removeTag: async (id: string, name: string) => {
    const response = await api.delete(`/tasks/${id}/tags`, { data: { name } });
    return unwrapResponse(response.data);
  },

  // Subtasks & Checklist
  addSubtask: async (id: string, data: { title: string; description: string; assignedTo: string; assignedBy: string }) => {
    const response = await api.post(`/tasks/${id}/subtasks`, data);
    return unwrapResponse(response.data);
  },

  addChecklistItem: async (id: string, text: string) => {
    const response = await api.post(`/tasks/${id}/checklist`, { text });
    return unwrapResponse(response.data);
  },

  updateChecklistItem: async (id: string, itemId: string, completed: boolean, completedBy?: string) => {
    const response = await api.patch(`/tasks/${id}/checklist`, { itemId, completed, completedBy });
    return unwrapResponse(response.data);
  },

  deleteChecklistItem: async (id: string, itemId: string) => {
    const response = await api.delete(`/tasks/${id}/checklist/${itemId}`);
    return unwrapResponse(response.data);
  },

  getSubtaskProgress: async (id: string) => {
    const response = await api.get(`/tasks/${id}/subtasks/progress`);
    return unwrapResponse(response.data);
  },

  // Recurring
  setRecurring: async (id: string, pattern: string, enabled: boolean) => {
    const response = await api.post(`/tasks/${id}/recurring`, { pattern, enabled });
    return unwrapResponse(response.data);
  },

  // Dependencies
  addDependency: async (id: string, dependsOn: string, type?: string) => {
    const response = await api.post(`/tasks/${id}/dependencies`, { dependsOn, type });
    return unwrapResponse(response.data);
  },

  removeDependency: async (id: string, dependencyId: string) => {
    const response = await api.delete(`/tasks/${id}/dependencies/${dependencyId}`);
    return unwrapResponse(response.data);
  },

  getDependencyGraph: async (projectId?: string) => {
    const params = projectId ? `?projectId=${projectId}` : '';
    const response = await api.get(`/tasks/dependencies/graph${params}`);
    return unwrapResponse(response.data);
  },

  getCriticalPath: async (projectId: string) => {
    const response = await api.get(`/tasks/dependencies/critical-path?projectId=${projectId}`);
    return unwrapResponse(response.data);
  },

  checkBlocked: async (id: string) => {
    const response = await api.get(`/tasks/${id}/dependencies/blocked`);
    return unwrapResponse(response.data);
  },

  // Search
  search: async (filters: any, page = 1, limit = 20) => {
    const params = new URLSearchParams({ ...filters, page: page.toString(), limit: limit.toString() });
    const response = await api.get(`/tasks/search?${params}`);
    return unwrapResponse(response.data);
  },

  saveSearch: async (name: string, filters: any) => {
    const response = await api.post('/tasks/search/saved', { name, filters });
    return unwrapResponse(response.data);
  },

  getSavedSearches: async () => {
    const response = await api.get('/tasks/search/saved');
    return unwrapResponse(response.data);
  },

  deleteSavedSearch: async (id: string) => {
    const response = await api.delete(`/tasks/search/saved/${id}`);
    return unwrapResponse(response.data);
  },

  // Recurring (server-side filter)
  getRecurring: async () => {
    const response = await api.get('/tasks?isRecurring=true');
    return unwrapResponse(response.data);
  },

  // Clone
  clone: async (id: string) => {
    const response = await api.post(`/tasks/${id}/clone`);
    return unwrapResponse(response.data);
  },

  // Watchers
  addWatcher: async (id: string, userId: string) => {
    const response = await api.post(`/tasks/${id}/watchers`, { userId });
    return unwrapResponse(response.data);
  },

  removeWatcher: async (id: string, userId: string) => {
    const response = await api.delete(`/tasks/${id}/watchers/${userId}`);
    return unwrapResponse(response.data);
  },

  // Custom Fields
  addCustomField: async (id: string, field: { fieldName: string; fieldType: string; value: any; options?: string[] }) => {
    const response = await api.post(`/tasks/${id}/custom-fields`, field);
    return unwrapResponse(response.data);
  },

  removeCustomField: async (id: string, fieldName: string) => {
    const response = await api.delete(`/tasks/${id}/custom-fields/${fieldName}`);
    return unwrapResponse(response.data);
  },

  updateCustomField: async (id: string, fieldName: string, value: any) => {
    const response = await api.patch(`/tasks/${id}/custom-fields/${fieldName}`, { value });
    return unwrapResponse(response.data);
  },

  // Bulk Operations
  bulkUpdate: async (taskIds: string[], updates: any) => {
    const response = await api.patch('/tasks/bulk', { taskIds, updates });
    return unwrapResponse(response.data);
  },

  // Templates
  getTemplates: async () => {
    const response = await api.get('/tasks/templates/all');
    return unwrapResponse(response.data);
  },

  createFromTemplate: async (templateId: string, data?: any) => {
    const response = await api.post(`/tasks/templates/${templateId}/create`, data);
    return unwrapResponse(response.data);
  },

  saveAsTemplate: async (id: string, templateName: string) => {
    const response = await api.post(`/tasks/${id}/templates/save`, { templateName });
    return unwrapResponse(response.data);
  },

  updateTemplate: async (id: string, data: any) => {
    const response = await api.put(`/tasks/templates/${id}`, data);
    return unwrapResponse(response.data);
  },

  deleteTemplate: async (id: string) => {
    const response = await api.delete(`/tasks/templates/${id}`);
    return unwrapResponse(response.data);
  },

  // Advanced Search
  advancedSearch: async (filters: any) => {
    const response = await api.get('/tasks/search', { params: filters });
    return unwrapResponse(response.data);
  },

  getSearchSuggestions: async (query: string) => {
    const response = await api.get('/tasks/search/suggestions', { params: { query } });
    return unwrapResponse(response.data);
  },

  // Calendar & Timeline
  getCalendarView: async (startDate: string, endDate: string) => {
    const response = await api.get('/tasks/calendar/view', { params: { startDate, endDate } });
    return unwrapResponse(response.data);
  },

  getTimelineView: async (projectId?: string) => {
    const params = projectId ? { projectId } : {};
    const response = await api.get('/tasks/calendar/timeline', { params });
    return unwrapResponse(response.data);
  },

  exportICalendar: async (taskIds?: string[]) => {
    const params = taskIds ? { taskIds: taskIds.join(',') } : {};
    const response = await api.get('/tasks/calendar/export', { params, responseType: 'blob' });
    return unwrapResponse(response.data);
  },

  syncGoogleCalendar: async (accessToken: string, calendarId: string) => {
    const response = await api.post('/tasks/calendar/sync/google', { accessToken, calendarId });
    return unwrapResponse(response.data);
  },

  // Subtask operations
  deleteSubtask: async (id: string, subtaskId: string) => {
    const response = await api.delete(`/tasks/${id}/subtasks/${subtaskId}`);
    return unwrapResponse(response.data);
  },

  // Analytics
  getAnalytics: async (projectId?: string, userId?: string, startDate?: string, endDate?: string) => {
    const params: any = {};
    if (projectId) params.projectId = projectId;
    if (userId) params.userId = userId;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const response = await api.get('/tasks/analytics', { params });
    return unwrapResponse(response.data);
  },

  getProductivityMetrics: async (userId: string, startDate?: string, endDate?: string) => {
    const params: any = { userId };
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const response = await api.get('/tasks/analytics/productivity', { params });
    return unwrapResponse(response.data);
  },

  getProjectAnalytics: async (projectId: string) => {
    const response = await api.get('/tasks/analytics/project', { params: { projectId } });
    return unwrapResponse(response.data);
  },

  getVelocity: async (projectId?: string) => {
    const params = projectId ? { projectId } : {};
    const response = await api.get('/tasks/analytics/velocity', { params });
    return unwrapResponse(response.data);
  },

  getTeamPerformance: async (projectId?: string) => {
    const params = projectId ? { projectId } : {};
    const response = await api.get('/tasks/analytics/team-performance', { params });
    return unwrapResponse(response.data);
  },

  // Gantt Chart
  getGanttData: async (projectId: string) => {
    const response = await api.get('/tasks/gantt', { params: { projectId } });
    return unwrapResponse(response.data);
  },

  updateGanttTask: async (id: string, data: { start_date?: string; end_date?: string; progress?: number }) => {
    const response = await api.patch(`/tasks/gantt/${id}`, data);
    return unwrapResponse(response.data);
  },

  // Bulk Operations
  bulkDelete: async (taskIds: string[]) => {
    const response = await api.delete('/tasks/bulk/delete', { data: { taskIds } });
    return unwrapResponse(response.data);
  },

  bulkAssign: async (taskIds: string[], assignedTo: string) => {
    const response = await api.patch('/tasks/bulk/assign', { taskIds, assignedTo });
    return unwrapResponse(response.data);
  },

  bulkStatusChange: async (taskIds: string[], status: string) => {
    const response = await api.patch('/tasks/bulk/status', { taskIds, status });
    return unwrapResponse(response.data);
  },

  bulkPriorityChange: async (taskIds: string[], priority: string) => {
    const response = await api.patch('/tasks/bulk/priority', { taskIds, priority });
    return unwrapResponse(response.data);
  },

  bulkAddTags: async (taskIds: string[], tags: Array<{ name: string; color: string }>) => {
    const response = await api.patch('/tasks/bulk/tags', { taskIds, tags });
    return unwrapResponse(response.data);
  },

  bulkSetDueDate: async (taskIds: string[], dueDate: string) => {
    const response = await api.patch('/tasks/bulk/due-date', { taskIds, dueDate });
    return unwrapResponse(response.data);
  },

  bulkClone: async (taskIds: string[]) => {
    const response = await api.post('/tasks/bulk/clone', { taskIds });
    return unwrapResponse(response.data);
  },

  bulkArchive: async (taskIds: string[]) => {
    const response = await api.patch('/tasks/bulk/archive', { taskIds });
    return unwrapResponse(response.data);
  }
};



export default tasksAPI;
