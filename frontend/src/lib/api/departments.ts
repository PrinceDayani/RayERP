import api from './api';

export interface Department {
  _id: string;
  name: string;
  description: string;
  manager: {
    name: string;
    email: string;
    phone: string;
  };
  location: string;
  budget: number;
  status: 'active' | 'inactive';
  employeeCount: number;
  permissions?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface DepartmentStats {
  total: number;
  active: number;
  inactive: number;
  totalEmployees: number;
  totalBudget: number;
  avgTeamSize: string;
}

export interface Employee {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  position: string;
  status: string;
  department?: string;
  departments?: string[];
}

export interface DepartmentAnalytics {
  overview: {
    totalEmployees: number;
    totalProjects: number;
    budget: number;
    budgetUtilization: number;
    activeProjects: number;
    completedProjects: number;
  };
  employeeStats: {
    byPosition: Record<string, number>;
    byStatus: Record<string, number>;
  };
  projectStats: {
    byStatus: Record<string, number>;
    totalBudget: number;
  };
  activityTrends: {
    totalActivities: number;
    recentActivities: any[];
    activityByType: Record<string, number>;
  };
  performance: {
    employeeGrowth: number;
    projectCompletionRate: string;
    budgetEfficiency: string;
  };
}

export interface ActivityLog {
  _id: string;
  timestamp: string;
  userName: string;
  action: string;
  resource: string;
  resourceType: string;
  details: string;
  status: 'success' | 'error' | 'warning';
}

export const departmentApi = {
  getAll: async (search?: string, status?: string) => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (status) params.append('status', status);
    const { data } = await api.get(`/departments?${params.toString()}`);
    return data;
  },

  getAllEmployees: async () => {
    const { data } = await api.get('/departments/all-employees');
    return data;
  },

  getById: async (id: string) => {
    const { data } = await api.get(`/departments/${id}`);
    return data;
  },

  create: async (department: Omit<Department, '_id' | 'employeeCount' | 'createdAt' | 'updatedAt'>) => {
    const { data } = await api.post('/departments', department);
    return data;
  },

  update: async (id: string, department: Partial<Department>) => {
    const { data } = await api.put(`/departments/${id}`, department);
    return data;
  },

  delete: async (id: string) => {
    const { data } = await api.delete(`/departments/${id}`);
    return data;
  },

  getStats: async () => {
    const { data } = await api.get('/departments/stats');
    return data;
  },

  updateEmployeeCount: async (id: string) => {
    const { data } = await api.patch(`/departments/${id}/employee-count`);
    return data;
  },

  getEmployees: async (id: string) => {
    const { data } = await api.get(`/departments/${id}/employees`);
    return data;
  },

  assignEmployees: async (id: string, employeeIds: string[]) => {
    const { data } = await api.post(`/departments/${id}/assign-employees`, { employeeIds });
    return data;
  },

  unassignEmployee: async (id: string, employeeId: string) => {
    const { data } = await api.delete(`/departments/${id}/employees/${employeeId}`);
    return data;
  },

  getPermissions: async (id: string) => {
    const { data } = await api.get(`/departments/${id}/permissions`);
    return data;
  },

  updatePermissions: async (id: string, permissions: string[]) => {
    const { data } = await api.put(`/departments/${id}/permissions`, { permissions });
    return data;
  },

  addPermission: async (id: string, permission: string) => {
    const { data } = await api.post(`/departments/${id}/permissions/add`, { permission });
    return data;
  },

  removePermission: async (id: string, permission: string) => {
    const { data } = await api.post(`/departments/${id}/permissions/remove`, { permission });
    return data;
  },

  deleteWithConfirmation: async (id: string, confirmText: string) => {
    const { data } = await api.delete(`/departments/${id}`, { data: { confirmText } });
    return data;
  },

  getAnalytics: async (id: string) => {
    const { data } = await api.get(`/departments/${id}/analytics`);
    return data;
  },

  getProjects: async (id: string) => {
    const { data } = await api.get(`/departments/${id}/projects`);
    return data;
  },

  getNotifications: async (id: string) => {
    const { data } = await api.get(`/departments/${id}/notifications`);
    return data;
  },

  getActivityLogs: async (id: string, params?: { page?: number; limit?: number; action?: string; dateFrom?: string; dateTo?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.action) queryParams.append('action', params.action);
    if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom);
    if (params?.dateTo) queryParams.append('dateTo', params.dateTo);
    const { data } = await api.get(`/departments/${id}/activity-logs?${queryParams.toString()}`);
    return data;
  },
};

export const employeeApi = {
  getAll: async () => {
    try {
      const { data } = await api.get('/employees');
      console.log('Employee API response:', data);
      return data;
    } catch (error: any) {
      console.error('Employee API error:', error.response?.data || error.message);
      throw error;
    }
  },
};
