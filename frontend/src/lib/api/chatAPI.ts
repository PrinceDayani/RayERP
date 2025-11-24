import api from './api';

export const chatAPI = {
  getChats: async () => {
    const response = await api.get('/chat/chats');
    return response.data;
  },

  getOrCreateChat: async (participantId: string) => {
    const response = await api.post('/chat/chats', { participantId });
    return response.data;
  },

  sendMessage: async (chatId: string, content: string, type = 'text', fileData?: string, fileName?: string, fileSize?: number, mimeType?: string, replyTo?: string) => {
    let location;
    if (navigator.geolocation && navigator.permissions) {
      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        if (permission.state === 'granted') {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 2000 });
          });
          location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
        }
      } catch (error) {
        // Silently fail
      }
    }

    // Get device info for better tracking
    const deviceInfo = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };

    const response = await api.post('/chat/chats/message', {
      chatId,
      content,
      type,
      fileData,
      fileName,
      fileSize,
      mimeType,
      replyTo,
      location,
      deviceInfo,
      status: 'sending' // Initial status
    });
    return response.data;
  },

  getMessages: async (chatId: string) => {
    const response = await api.get(`/chat/chats/${chatId}/messages`);
    return response.data;
  },

  markAsRead: async (chatId: string) => {
    if (!chatId || typeof chatId !== 'string') {
      throw new Error('Invalid chat ID provided');
    }
    const response = await api.put(`/chat/chats/${chatId}/read`);
    return response.data;
  },

  getUsers: async () => {
    const response = await api.get('/chat/users');
    return response.data;
  },

  updateMessageStatus: async (messageId: string, status: 'sent' | 'delivered' | 'read' | 'failed') => {
    const response = await api.put(`/chat/messages/${messageId}/status`, { status });
    return response.data;
  },

  markMessagesAsRead: async (chatId: string, messageIds: string[]) => {
    const response = await api.put(`/chat/chats/${chatId}/messages/read`, { messageIds });
    return response.data;
  },

  editMessage: async (messageId: string, content: string) => {
    const response = await api.put(`/chat/messages/${messageId}`, { content });
    return response.data;
  },

  deleteMessage: async (messageId: string) => {
    const response = await api.delete(`/chat/messages/${messageId}`);
    return response.data;
  },

  getOnlineUsers: async () => {
    const response = await api.get('/chat/users/online');
    return response.data;
  },

  getUserStatus: async (userId: string) => {
    const response = await api.get(`/chat/users/${userId}/status`);
    return response.data;
  }
};



export default chatAPI;
