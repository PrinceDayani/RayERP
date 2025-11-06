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
  position: string;
  status: string;
}

export const departmentApi = {
  getAll: async (search?: string, status?: string) => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (status) params.append('status', status);
    const { data } = await api.get(`/departments?${params.toString()}`);
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
};

export const employeeApi = {
  getAll: async () => {
    const { data } = await api.get('/employees');
    return data;
  },
};
