import api from './api';

export const notificationApi = {
  getAll: (params?: { page?: number; limit?: number; read?: boolean; type?: string }) =>
    api.get('/notifications', { params }),

  getUnreadCount: () =>
    api.get('/notifications/unread-count'),

  markAsRead: (id: string) =>
    api.patch(`/notifications/${id}/read`),

  markAllAsRead: () =>
    api.patch('/notifications/mark-all-read'),

  delete: (id: string) =>
    api.delete(`/notifications/${id}`),

  deleteAll: () =>
    api.delete('/notifications'),

  sendTest: () =>
    api.post('/notifications/test')
};
