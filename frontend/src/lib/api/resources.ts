import api from './api';
import { ResourceAllocation, CapacityPlan, SkillMatrix, TimeTracking, SkillGapAnalysis, ProjectSkillMatch, SkillDistribution, SkillFilters, SkillLevel } from '@/types/resource';

export const resourceApi = {
  allocateResource: (data: Partial<ResourceAllocation>) =>
    api.post<ResourceAllocation>('/resources/allocations', data),

  getResourceAllocations: (params?: { projectId?: string; employeeId?: string; status?: string }) =>
    api.get<ResourceAllocation[]>('/resources/allocations', { params }),

  updateResourceAllocation: (id: string, data: Partial<ResourceAllocation>) =>
    api.put<ResourceAllocation>(`/resources/allocations/${id}`, data),

  deleteResourceAllocation: (id: string) =>
    api.delete(`/resources/allocations/${id}`),

  getResourceUtilization: (params: { employeeId: string; startDate?: string; endDate?: string }) =>
    api.get<{ totalHours: number; avgUtilization: number; allocations: ResourceAllocation[] }>(
      '/resources/utilization',
      { params }
    ),

  detectResourceConflicts: (params: { employeeId: string; startDate: string; endDate: string }) =>
    api.get<{ hasConflict: boolean; totalAllocated: number; conflicts: ResourceAllocation[] }>(
      '/resources/conflicts',
      { params }
    ),

  getCapacityPlanning: (params: { startDate: string; endDate: string }) =>
    api.get<CapacityPlan[]>('/resources/capacity-planning', { params }),

  getSkillMatrix: (filters?: SkillFilters) =>
    api.get<{ matrix: SkillMatrix[]; allSkills: string[] }>('/resources/skill-matrix', { params: filters }),

  updateEmployeeSkill: (employeeId: string, skill: string, level: SkillLevel) =>
    api.put(`/resources/skill-matrix/${employeeId}/skills`, { skill, level }),

  getSkillGapAnalysis: (filters?: { department?: string; position?: string }) =>
    api.get<SkillGapAnalysis[]>('/resources/skill-gap-analysis', { params: filters }),

  getProjectSkillMatch: (projectId: string) =>
    api.get<ProjectSkillMatch[]>(`/resources/project-skill-match/${projectId}`),

  getSkillDistribution: () =>
    api.get<SkillDistribution[]>('/resources/skill-distribution'),

  getSkillStrengthAnalysis: () =>
    api.get<{ teamStrength: any; departmentStrength: any }>('/resources/skill-strength'),

  getTimeTracking: (params?: { employeeId?: string; projectId?: string; startDate?: string; endDate?: string }) =>
    api.get<TimeTracking>('/resources/time-tracking', { params }),

  // Enhanced allocation management
  getAllocationConflicts: (params?: { employeeId?: string; startDate?: string; endDate?: string }) =>
    api.get('/resources/allocation-conflicts', { params }),

  getEmployeeSummary: (params?: { departmentId?: string; startDate?: string; endDate?: string }) =>
    api.get('/resources/employee-summary', { params }),

  exportAllocations: (options: any) =>
    api.post('/resources/export-allocations', options, { responseType: 'blob' }),

  bulkUpdateAllocations: (updates: Array<{ id: string; data: Partial<ResourceAllocation> }>) =>
    api.put('/resources/bulk-update', { updates }),

  getGanttData: (params?: { projectIds?: string[]; startDate?: string; endDate?: string }) =>
    api.get('/resources/gantt-data', { params }),
};
