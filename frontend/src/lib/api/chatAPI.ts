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

  sendMessage: async (chatId: string, content: string, type = 'text', fileUrl?: string) => {
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

    const response = await api.post('/chat/chats/message', {
      chatId,
      content,
      type,
      fileUrl,
      location
    });
    return response.data;
  },

  getMessages: async (chatId: string) => {
    const response = await api.get(`/chat/chats/${chatId}/messages`);
    return response.data;
  },

  markAsRead: async (chatId: string) => {
    const response = await api.put(`/chat/chats/${chatId}/read`);
    return response.data;
  },

  getUsers: async () => {
    const response = await api.get('/chat/users');
    return response.data;
  }
};

export default chatAPI;
