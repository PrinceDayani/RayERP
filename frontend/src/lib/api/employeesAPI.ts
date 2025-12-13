import api from './api';

export interface Employee {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  position?: string;
  department?: string;
  salary?: number;
  hireDate?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export const employeesAPI = {
  getAll: async (params = {}) => {
    const response = await api.get('/employees', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/employees/${id}`);
    return response.data;
  },

  getEmployee: async (id: string) => {
    const response = await api.get(`/employees/${id}`);
    return response.data;
  },

  create: async (employeeData: any) => {
    const response = await api.post('/employees', employeeData);
    return response.data;
  },

  edit: async (id: string, employeeData: any) => {
    const response = await api.put(`/employees/${id}`, employeeData);
    return response.data;
  },

  update: async (id: string, employeeData: any) => {
    const response = await api.put(`/employees/${id}`, employeeData);
    return response.data;
  },

  updateEmployee: async (id: string, employeeData: any) => {
    const response = await api.put(`/employees/${id}`, employeeData);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/employees/${id}`);
    return response.data;
  },
  
  getSalesReps: async () => {
    const response = await api.get('/employees/sales-reps');
    return response.data;
  }
};

// Export individual functions for flexibility
export const getAllEmployees = employeesAPI.getAll;
export const getEmployeeById = employeesAPI.getById;
export const createEmployee = employeesAPI.create;
export const editEmployee = employeesAPI.edit;
export const updateEmployee = employeesAPI.update;
export const deleteEmployee = employeesAPI.delete;
export const getSalesReps = employeesAPI.getSalesReps;

export default employeesAPI;
