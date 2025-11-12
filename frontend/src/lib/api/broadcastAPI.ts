import api from './api';

export const broadcastAPI = {
  sendBroadcast: async (content: string, type: 'department' | 'webapp', departmentId?: string) => {
    const response = await api.post('/broadcast/send', { content, type, departmentId });
    return response.data;
  },

  getBroadcasts: async () => {
    const response = await api.get('/broadcast');
    return response.data;
  },

  markAsRead: async (broadcastId: string) => {
    const response = await api.put(`/broadcast/${broadcastId}/read`);
    return response.data;
  }
};

export default broadcastAPI;
