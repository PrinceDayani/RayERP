import api from './api';

const apiRequest = async (url: string, options?: any) => {
  const response = await api(url, options);
  return response.data;
};

export interface User {
  _id: string;
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  role: any;
  department?: string;
  avatarUrl?: string;
  status: string;
  lastLogin?: string;
}

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  roleId?: string;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  roleId?: string;
  status?: string;
}

export interface StatusChangeRequest {
  _id: string;
  name: string;
  status: string;
  statusChangeRequest: {
    requestedStatus: string;
    reason?: string;
    requestedBy: {
      name: string;
    };
    requestedAt: string;
  };
}

const usersAPI = {
  getAll: async (): Promise<User[]> => {
    try {
      return await apiRequest('/api/users');
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  getById: async (userId: string): Promise<User> => {
    try {
      const response = await apiRequest(`/api/users/${userId}`);
      return response.user || response;
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  },

  create: async (userData: CreateUserData): Promise<User> => {
    try {
      const response = await apiRequest('/api/users', {
        method: 'POST',
        body: JSON.stringify(userData)
      });
      return response.user || response;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  update: async (userId: string, userData: UpdateUserData): Promise<User> => {
    try {
      const response = await apiRequest(`/api/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(userData)
      });
      return response.user || response;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  },

  delete: async (userId: string): Promise<void> => {
    try {
      await apiRequest(`/api/users/${userId}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  },

  assignRole: async (userId: string, roleId: string): Promise<User> => {
    try {
      const response = await apiRequest(`/api/users/${userId}/role`, {
        method: 'PUT',
        body: JSON.stringify({ roleId })
      });
      return response.user || response;
    } catch (error) {
      console.error('Error assigning role:', error);
      throw error;
    }
  },

  bulkAssignRoles: async (userIds: string[], roleId: string): Promise<{ success: boolean; updated: number }> => {
    try {
      return await apiRequest('/api/users/bulk/role', {
        method: 'PUT',
        body: JSON.stringify({ userIds, roleId })
      });
    } catch (error) {
      console.error('Error bulk assigning roles:', error);
      throw error;
    }
  },

  resetPassword: async (userId: string, newPassword: string): Promise<void> => {
    try {
      await apiRequest(`/api/users/${userId}/reset-password`, {
        method: 'PUT',
        body: JSON.stringify({ newPassword })
      });
    } catch (error) {
      console.error('Error resetting password:', error);
      throw error;
    }
  },

  activate: async (userId: string): Promise<User> => {
    try {
      const response = await apiRequest(`/api/users/${userId}/activate`, {
        method: 'PUT'
      });
      return response.user || response;
    } catch (error) {
      console.error('Error activating user:', error);
      throw error;
    }
  },

  deactivate: async (userId: string): Promise<User> => {
    try {
      const response = await apiRequest(`/api/users/${userId}/deactivate`, {
        method: 'PUT'
      });
      return response.user || response;
    } catch (error) {
      console.error('Error deactivating user:', error);
      throw error;
    }
  },

  requestStatusChange: async (userId: string, status: string, reason: string): Promise<StatusChangeRequest> => {
    try {
      const response = await apiRequest(`/api/users/${userId}/status-change-request`, {
        method: 'POST',
        body: JSON.stringify({ status, reason })
      });
      return response.request || response;
    } catch (error) {
      console.error('Error requesting status change:', error);
      throw error;
    }
  },

  getPendingStatusRequests: async (): Promise<StatusChangeRequest[]> => {
    try {
      const response = await apiRequest('/api/users/status-change-requests');
      return response.requests || response || [];
    } catch (error) {
      console.error('Error fetching pending status requests:', error);
      throw error;
    }
  },

  approveStatusChange: async (requestId: string, approve: boolean): Promise<void> => {
    try {
      await apiRequest(`/api/users/status-change-requests/${requestId}`, {
        method: 'PUT',
        body: JSON.stringify({ approve })
      });
    } catch (error) {
      console.error('Error approving status change:', error);
      throw error;
    }
  }
};

export default usersAPI;
