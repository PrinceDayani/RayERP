import api from './api';
import { unwrapResponse } from './unwrap';

export const EMPLOYMENT_CATEGORIES = [
  'Skill - Above Limit (PF)',
  'Skill - Above Limit (W/o PF)',
  'Skill - Below Limit (W/o PF)',
  'Unskill - Above Limit (PF)',
  'Unskill - Below Limit (W/o PF)',
  'Retired Person',
] as const;

export type EmploymentCategory = (typeof EMPLOYMENT_CATEGORIES)[number];

export interface BankDetails {
  accountNumber?: string;
  bankName?: string;
  ifscCode?: string;
}

export interface StatutoryDetails {
  uanNumber?: string;
  pfApplicable?: boolean;
  esicApplicable?: boolean;
}

/** Monthly figures. `Employee.salary` is the annual gross. */
export interface Compensation {
  monthlyGross?: number;
  monthlyNet?: number;
  incrementAmount?: number;
  incrementPercent?: number;
  tds?: number;
  providentFund?: number;
  professionalTax?: number;
  esic?: number;
  effectiveFrom?: string;
}

export interface SalaryRevision {
  effectiveFrom: string;
  label?: string;
  monthlyGross: number;
  reason?: string;
  recordedBy?: { _id: string; name?: string; email?: string } | string;
  recordedAt?: string;
}

export interface EmployeeFilterOptions {
  workLocations: string[];
  projectAssignments: string[];
  employmentCategories: string[];
}

export interface Employee {
  _id: string;
  employeeId?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  position?: string;
  department?: string;
  departments?: string[];
  salary?: number;
  hireDate?: string;
  status: 'active' | 'inactive' | 'terminated';
  workLocation?: string;
  projectAssignment?: string;
  reportingAuthority?: string;
  qualification?: string;
  employmentCategory?: EmploymentCategory;
  dateOfBirth?: string;
  dateOfRelieving?: string;
  totalExperienceYears?: number;
  alternatePhone?: string;
  experienceInCompany?: string;
  registerSerialNo?: number;
  // Omitted from the response unless the caller holds employees.view_bank_details
  bankDetails?: BankDetails;
  statutory?: StatutoryDetails;
  // Omitted from the response unless the caller holds employees.view_salary
  compensation?: Compensation;
  salaryHistory?: SalaryRevision[];
  createdAt: string;
  updatedAt: string;
}

export const employeesAPI = {
  getAll: async (params = {}) => {
    const response = await api.get('/employees', { params });
    return response.data;
  },

  getFilterOptions: async (): Promise<EmployeeFilterOptions> => {
    const response = await api.get('/employees/filter-options');
    return unwrapResponse(response.data);
  },

  getById: async (id: string) => {
    const response = await api.get(`/employees/${id}`);
    return unwrapResponse(response.data);
  },

  getEmployee: async (id: string) => {
    const response = await api.get(`/employees/${id}`);
    return unwrapResponse(response.data);
  },

  create: async (employeeData: any) => {
    const response = await api.post('/employees', employeeData);
    return unwrapResponse(response.data);
  },

  edit: async (id: string, employeeData: any) => {
    const response = await api.put(`/employees/${id}`, employeeData);
    return unwrapResponse(response.data);
  },

  update: async (id: string, employeeData: any) => {
    const response = await api.put(`/employees/${id}`, employeeData);
    return unwrapResponse(response.data);
  },

  updateEmployee: async (id: string, employeeData: any) => {
    const response = await api.put(`/employees/${id}`, employeeData);
    return unwrapResponse(response.data);
  },

  delete: async (id: string) => {
    const response = await api.delete(`/employees/${id}`);
    return response.data;
  },

  getSalesReps: async () => {
    const response = await api.get('/employees/sales-reps');
    return response.data;
  },

  getTasks: async (id: string, params = {}) => {
    const response = await api.get(`/employees/${id}/tasks`, { params });
    return unwrapResponse(response.data);
  },

  getTaskStats: async (id: string) => {
    const response = await api.get(`/employees/${id}/tasks/stats`);
    return unwrapResponse(response.data);
  }
};

// Export individual functions for flexibility
export const getAllEmployees = employeesAPI.getAll;
export const getEmployeeFilterOptions = employeesAPI.getFilterOptions;
export const getEmployeeById = employeesAPI.getById;
export const createEmployee = employeesAPI.create;
export const editEmployee = employeesAPI.edit;
export const updateEmployee = employeesAPI.update;
export const deleteEmployee = employeesAPI.delete;
export const getSalesReps = employeesAPI.getSalesReps;
export const getTasks = employeesAPI.getTasks;
export const getTaskStats = employeesAPI.getTaskStats;

export default employeesAPI;
