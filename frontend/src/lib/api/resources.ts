import api from './api';
import { ResourceAllocation, CapacityPlan, SkillMatrix, TimeTracking } from '@/types/resource';

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

  getSkillMatrix: () =>
    api.get<{ matrix: SkillMatrix[]; allSkills: string[] }>('/resources/skill-matrix'),

  getTimeTracking: (params?: { employeeId?: string; projectId?: string; startDate?: string; endDate?: string }) =>
    api.get<TimeTracking>('/resources/time-tracking', { params }),
};
