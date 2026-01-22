// Enhanced Department API Client - Enterprise Grade
import api from './api';

import {
  Department,
  Employee,
  DepartmentAnalytics,
  DepartmentProject,
  ActivityLog,
  DepartmentNotification,
  BudgetHistory,
  PerformanceMetrics,
  TeamStructure,
  UpcomingDeadline,
  ResourceUtilization,
  ComplianceStatus,
  DepartmentGoal,
  BudgetAdjustment,
  DepartmentFormData,
  DepartmentExportOptions,
  DepartmentReport
} from '@/types/department';

// Additional types for the API
export interface DepartmentStats {
  total: number;
  active: number;
  inactive: number;
  totalEmployees: number;
  totalBudget: number;
  avgTeamSize: string;
}

export interface DepartmentManager {
  name: string;
  email: string;
  phone?: string;
}

export class DepartmentApiClient {
  private baseUrl = '/departments';

  async getPerformanceMetrics(departmentId: string, period?: string) {
    const params = period ? `?period=${period}` : '';
    return api.get(`${this.baseUrl}/${departmentId}/performance${params}`);
  }

  async getTeamStructure(departmentId: string) {
    return api.get(`${this.baseUrl}/${departmentId}/team-structure`);
  }

  async getResourceUtilization(departmentId: string, period?: string) {
    const params = period ? `?period=${period}` : '';
    return api.get(`${this.baseUrl}/${departmentId}/resource-utilization${params}`);
  }

  async getBudgetHistory(departmentId: string, params?: any) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) queryParams.append(key, value.toString());
      });
    }
    return api.get(`${this.baseUrl}/${departmentId}/budget-history?${queryParams}`);
  }

  async getExpenses(departmentId: string, params?: any) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) queryParams.append(key, value.toString());
      });
    }
    return api.get(`${this.baseUrl}/${departmentId}/expenses?${queryParams}`);
  }

  async getGoals(departmentId: string, params?: any) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) queryParams.append(key, value.toString());
      });
    }
    return api.get(`${this.baseUrl}/${departmentId}/goals?${queryParams}`);
  }

  async getComplianceStatus(departmentId: string) {
    return api.get(`${this.baseUrl}/${departmentId}/compliance`);
  }

  async getUpcomingDeadlines(departmentId: string, params?: any) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) queryParams.append(key, value.toString());
      });
    }
    return api.get(`${this.baseUrl}/${departmentId}/deadlines?${queryParams}`);
  }

  async adjustBudget(departmentId: string, adjustment: BudgetAdjustment) {
    return api.post(`${this.baseUrl}/${departmentId}/adjust-budget`, adjustment);
  }

  async createGoal(departmentId: string, goalData: Omit<DepartmentGoal, "id">) {
    return api.post(`${this.baseUrl}/${departmentId}/goals`, goalData);
  }

  async updateGoal(departmentId: string, goalId: string, goalData: Partial<DepartmentGoal>) {
    return api.put(`${this.baseUrl}/${departmentId}/goals/${goalId}`, goalData);
  }

  async deleteGoal(departmentId: string, goalId: string) {
    return api.delete(`${this.baseUrl}/${departmentId}/goals/${goalId}`);
  }

  async getAll(search?: string, status?: string) {
    const params: any = {};
    if (search) params.search = search;
    if (status && status !== 'all') params.status = status;
    
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) queryParams.append(key, value.toString());
    });
    
    return api.get(`${this.baseUrl}?${queryParams}`);
  }

  async getStats() {
    return api.get(`${this.baseUrl}/stats`);
  }

  async getById(id: string) {
    return api.get(`${this.baseUrl}/${id}`);
  }

  async create(data: any) {
    return api.post(this.baseUrl, data);
  }

  async update(id: string, data: any) {
    return api.put(`${this.baseUrl}/${id}`, data);
  }

  async delete(id: string) {
    return api.delete(`${this.baseUrl}/${id}`);
  }

  async deleteWithConfirmation(id: string, confirmText: string) {
    return api.delete(`${this.baseUrl}/${id}`, {
      data: { confirmText }
    });
  }

  async getEmployees(departmentId: string, params?: any) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) queryParams.append(key, value.toString());
      });
    }
    return api.get(`${this.baseUrl}/${departmentId}/employees?${queryParams}`);
  }

  async getAllEmployees(params?: any) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) queryParams.append(key, value.toString());
      });
    }
    return api.get(`/employees?${queryParams}`);
  }

  async assignEmployees(departmentId: string, employeeIds: string[]) {
    return api.post(`${this.baseUrl}/${departmentId}/assign-employees`, {
      employeeIds
    });
  }

  async unassignEmployee(departmentId: string, employeeId: string) {
    return api.delete(`${this.baseUrl}/${departmentId}/employees/${employeeId}`);
  }

  async getPermissions(id: string) {
    return api.get(`${this.baseUrl}/${id}/permissions`);
  }

  async addPermission(id: string, permission: string) {
    return api.post(`${this.baseUrl}/${id}/permissions/add`, { permission });
  }

  async removePermission(id: string, permission: string) {
    return api.post(`${this.baseUrl}/${id}/permissions/remove`, { permission });
  }

  async getAnalytics(departmentId: string, params?: any) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) queryParams.append(key, value.toString());
      });
    }
    return api.get(`${this.baseUrl}/${departmentId}/analytics?${queryParams}`);
  }

  async getProjects(departmentId: string, params?: any) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) queryParams.append(key, value.toString());
      });
    }
    return api.get(`${this.baseUrl}/${departmentId}/projects?${queryParams}`);
  }

  async getNotifications(departmentId: string, params?: any) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) queryParams.append(key, value.toString());
      });
    }
    return api.get(`${this.baseUrl}/${departmentId}/notifications?${queryParams}`);
  }

  async getActivityLogs(departmentId: string, params?: any) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) queryParams.append(key, value.toString());
      });
    }
    return api.get(`${this.baseUrl}/${departmentId}/activity-logs?${queryParams}`);
  }
}

// Create and export the API client instance
export const departmentApi = new DepartmentApiClient();

// Re-export types from department types file
export type { Department, Employee } from '@/types/department';

// Create default export
export default departmentApi;