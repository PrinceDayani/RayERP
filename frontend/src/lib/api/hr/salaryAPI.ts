import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const getAuthHeaders = () => {
  const token = localStorage.getItem('auth-token');
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };
};

export interface SalaryUpdateRequest {
  salary: number;
  effectiveDate?: string;
  reason?: string;
}

export interface SalaryResponse {
  success: boolean;
  data: {
    employeeId: string;
    name: string;
    salary: number;
  };
  message?: string;
}

export interface SalaryUpdateResponse {
  success: boolean;
  data: {
    employeeId: string;
    name: string;
    oldSalary: number;
    newSalary: number;
    effectiveDate?: string;
    reason?: string;
  };
  message: string;
}

const salaryAPI = {
  /**
   * View salary information for an employee
   * Requires: employees.view_salary permission
   */
  viewSalary: async (employeeId: string): Promise<SalaryResponse> => {
    try {
      const response = await axios.get(
        `${API_URL}/api/salary/${employeeId}`,
        getAuthHeaders()
      );
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  },

  /**
   * Get salary information for an employee (alias)
   * Requires: employees.view_salary permission
   */
  getSalary: async (employeeId: string): Promise<SalaryResponse> => {
    try {
      const response = await axios.get(
        `${API_URL}/api/salary/${employeeId}`,
        getAuthHeaders()
      );
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  },

  /**
   * Edit salary for an employee
   * Requires: employees.edit_salary permission
   */
  editSalary: async (
    employeeId: string,
    data: SalaryUpdateRequest
  ): Promise<SalaryUpdateResponse> => {
    try {
      const response = await axios.put(
        `${API_URL}/api/salary/${employeeId}`,
        data,
        getAuthHeaders()
      );
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  },

  /**
   * Update salary for an employee (alias)
   * Requires: employees.edit_salary permission
   */
  updateSalary: async (
    employeeId: string,
    data: SalaryUpdateRequest
  ): Promise<SalaryUpdateResponse> => {
    try {
      const response = await axios.put(
        `${API_URL}/api/salary/${employeeId}`,
        data,
        getAuthHeaders()
      );
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  },

  /**
   * Get salary history for an employee
   * Requires: employees.view_salary permission
   */
  getSalaryHistory: async (employeeId: string): Promise<any> => {
    try {
      const response = await axios.get(
        `${API_URL}/api/salary/${employeeId}/history`,
        getAuthHeaders()
      );
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  },
};

export default salaryAPI;
