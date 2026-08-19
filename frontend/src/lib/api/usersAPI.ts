import api from './api';

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

/** Mirrors the backend UserStatusRequest document. */
export interface StatusChangeRequest {
  _id: string;
  user: Pick<User, '_id' | 'name' | 'email'>;
  requestedBy: Pick<User, '_id' | 'name' | 'email'>;
  currentStatus: string;
  requestedStatus: string;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  createdAt: string;
}

export interface StatusChangeResult {
  success: boolean;
  message?: string;
  /** True when the move needed approval and a request was recorded instead. */
  requiresApproval?: boolean;
  request?: { _id: string; status: string; requestedStatus: string };
}

const usersAPI = {
  // Returns a bare array.
  getAll: async (): Promise<User[]> => {
    const response = await api.get('/users');
    return response.data?.data ?? response.data ?? [];
  },

  getById: async (userId: string): Promise<User> => {
    const response = await api.get(`/users/${userId}`);
    return response.data?.user ?? response.data;
  },

  createUser: async (userData: CreateUserData): Promise<User> => {
    const response = await api.post('/users', userData);
    return response.data?.user ?? response.data;
  },

  updateUser: async (userId: string, userData: UpdateUserData): Promise<User> => {
    const response = await api.put(`/users/${userId}`, userData);
    return response.data?.user ?? response.data;
  },

  deleteUser: async (userId: string): Promise<void> => {
    await api.delete(`/users/${userId}`);
  },

  updateRole: async (userId: string, roleId: string): Promise<User> => {
    const response = await api.put(`/users/${userId}/role`, { roleId });
    return response.data?.user ?? response.data;
  },

  bulkUpdateRoles: async (userIds: string[], roleId: string): Promise<number> => {
    const response = await api.put('/users/bulk/role', { userIds, roleId });
    return response.data?.updated ?? 0;
  },

  resetPassword: async (userId: string, newPassword: string): Promise<void> => {
    await api.put(`/users/${userId}/reset-password`, { newPassword });
  },

  // Activating or disabling a user may need approval; the server decides and
  // says so via `requiresApproval` rather than applying the change.
  setStatus: async (userId: string, status: string, reason?: string): Promise<StatusChangeResult> => {
    const response = await api.put(`/users/${userId}/status`, { status, reason });
    return response.data;
  },

  activate: async (userId: string, reason?: string): Promise<StatusChangeResult> =>
    usersAPI.setStatus(userId, 'active', reason),

  deactivate: async (userId: string, reason?: string): Promise<StatusChangeResult> =>
    usersAPI.setStatus(userId, 'inactive', reason),

  requestStatusChange: async (userId: string, status: string, reason: string): Promise<StatusChangeResult> =>
    usersAPI.setStatus(userId, status, reason),

  getPendingStatusRequests: async (): Promise<StatusChangeRequest[]> => {
    const response = await api.get('/users/status-requests/pending');
    return response.data?.requests ?? [];
  },

  approveStatusRequest: async (requestId: string): Promise<void> => {
    await api.put(`/users/status-requests/${requestId}/approve`);
  },

  rejectStatusRequest: async (requestId: string, reason?: string): Promise<void> => {
    await api.put(`/users/status-requests/${requestId}/reject`, { reason });
  }
};

export default usersAPI;
