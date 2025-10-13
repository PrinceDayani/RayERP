// path: frontend/src/lib/authAPI.ts
import api from './api';

export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await api.post("/api/auth/login", { email, password });
    return response.data;
  },

  register: async (userData: any) => {
    const response = await api.post("/auth/register", userData);
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get("/api/auth/profile");
    return response.data;
  },
};

export default authAPI;