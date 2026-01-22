// Department React Query Hooks - Enterprise Caching & Real-time Updates
import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { departmentApi } from '@/lib/api/departments';
import { useToast } from '@/hooks/use-toast';
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
  DepartmentFormData
} from '@/types/department';

// Query Keys
export const departmentKeys = {
  all: ['departments'] as const,
  lists: () => [...departmentKeys.all, 'list'] as const,
  list: (filters: any) => [...departmentKeys.lists(), { filters }] as const,
  details: () => [...departmentKeys.all, 'detail'] as const,
  detail: (id: string) => [...departmentKeys.details(), id] as const,
  employees: (id: string) => [...departmentKeys.detail(id), 'employees'] as const,
  projects: (id: string) => [...departmentKeys.detail(id), 'projects'] as const,
  analytics: (id: string) => [...departmentKeys.detail(id), 'analytics'] as const,
  performance: (id: string) => [...departmentKeys.detail(id), 'performance'] as const,
  budget: (id: string) => [...departmentKeys.detail(id), 'budget'] as const,
  goals: (id: string) => [...departmentKeys.detail(id), 'goals'] as const,
  notifications: (id: string) => [...departmentKeys.detail(id), 'notifications'] as const,
  activityLogs: (id: string) => [...departmentKeys.detail(id), 'activity-logs'] as const,
  compliance: (id: string) => [...departmentKeys.detail(id), 'compliance'] as const,
  deadlines: (id: string) => [...departmentKeys.detail(id), 'deadlines'] as const,
  teamStructure: (id: string) => [...departmentKeys.detail(id), 'team-structure'] as const,
  resourceUtilization: (id: string) => [...departmentKeys.detail(id), 'resource-utilization'] as const,
};

// Core Department Hooks
export function useDepartment(id: string, options?: UseQueryOptions<Department>) {
  return useQuery({
    queryKey: departmentKeys.detail(id),
    queryFn: () => departmentApi.getById(id).then(res => res.data),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  });
}

export function useDepartments(params?: any) {
  return useQuery({
    queryKey: departmentKeys.list(params),
    queryFn: () => departmentApi.getAll(params).then(res => res.data),
    staleTime: 2 * 60 * 1000, // 2 minutes
    placeholderData: (previousData) => previousData,
  });
}

// Employee Management Hooks
export function useDepartmentEmployees(departmentId: string, params?: any) {
  return useQuery({
    queryKey: [...departmentKeys.employees(departmentId), params],
    queryFn: () => departmentApi.getEmployees(departmentId, params).then(res => res.data),
    staleTime: 3 * 60 * 1000, // 3 minutes
    enabled: !!departmentId,
  });
}

export function useAllEmployees(params?: any) {
  return useQuery({
    queryKey: ['employees', 'all', params],
    queryFn: () => departmentApi.getAllEmployees(params).then(res => res.data),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Project Management Hooks
export function useDepartmentProjects(departmentId: string, params?: any) {
  return useQuery({
    queryKey: [...departmentKeys.projects(departmentId), params],
    queryFn: () => departmentApi.getProjects(departmentId, params).then(res => res.data),
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: !!departmentId,
  });
}

// Analytics & Performance Hooks
export function useDepartmentAnalytics(departmentId: string, params?: any) {
  return useQuery({
    queryKey: [...departmentKeys.analytics(departmentId), params],
    queryFn: () => departmentApi.getAnalytics(departmentId, params).then(res => res.data),
    staleTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!departmentId,
  });
}

export function usePerformanceMetrics(departmentId: string, period?: string) {
  return useQuery({
    queryKey: [...departmentKeys.performance(departmentId), period],
    queryFn: () => departmentApi.getPerformanceMetrics(departmentId, period).then(res => res.data),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!departmentId,
  });
}

export function useTeamStructure(departmentId: string) {
  return useQuery({
    queryKey: departmentKeys.teamStructure(departmentId),
    queryFn: () => departmentApi.getTeamStructure(departmentId).then(res => res.data),
    staleTime: 15 * 60 * 1000, // 15 minutes
    enabled: !!departmentId,
  });
}

export function useResourceUtilization(departmentId: string, period?: string) {
  return useQuery({
    queryKey: [...departmentKeys.resourceUtilization(departmentId), period],
    queryFn: () => departmentApi.getResourceUtilization(departmentId, period).then(res => res.data),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!departmentId,
  });
}

// Budget Management Hooks
export function useBudgetHistory(departmentId: string, params?: any) {
  return useQuery({
    queryKey: [...departmentKeys.budget(departmentId), 'history', params],
    queryFn: () => departmentApi.getBudgetHistory(departmentId, params).then(res => res.data),
    staleTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!departmentId,
  });
}

// Goals Management Hooks
export function useDepartmentGoals(departmentId: string, params?: any) {
  return useQuery({
    queryKey: [...departmentKeys.goals(departmentId), params],
    queryFn: () => departmentApi.getGoals(departmentId, params).then(res => res.data),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!departmentId,
  });
}

// Activity & Notifications Hooks
export function useActivityLogs(departmentId: string, params?: any) {
  return useQuery({
    queryKey: [...departmentKeys.activityLogs(departmentId), params],
    queryFn: () => departmentApi.getActivityLogs(departmentId, params).then(res => res.data),
    staleTime: 1 * 60 * 1000, // 1 minute
    enabled: !!departmentId,
  });
}

export function useNotifications(departmentId: string, params?: any) {
  return useQuery({
    queryKey: [...departmentKeys.notifications(departmentId), params],
    queryFn: () => departmentApi.getNotifications(departmentId, params).then(res => res.data),
    staleTime: 30 * 1000, // 30 seconds
    enabled: !!departmentId,
    refetchInterval: 60 * 1000, // Refetch every minute
  });
}

// Compliance & Deadlines Hooks
export function useComplianceStatus(departmentId: string) {
  return useQuery({
    queryKey: departmentKeys.compliance(departmentId),
    queryFn: () => departmentApi.getComplianceStatus(departmentId).then(res => res.data),
    staleTime: 30 * 60 * 1000, // 30 minutes
    enabled: !!departmentId,
  });
}

export function useUpcomingDeadlines(departmentId: string, params?: any) {
  return useQuery({
    queryKey: [...departmentKeys.deadlines(departmentId), params],
    queryFn: () => departmentApi.getUpcomingDeadlines(departmentId, params).then(res => res.data),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!departmentId,
  });
}

// Mutation Hooks
export function useUpdateDepartment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<DepartmentFormData> }) =>
      departmentApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: departmentKeys.detail(id) });
      toast({
        title: 'Success',
        description: 'Department updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update department',
        variant: 'destructive',
      });
    },
  });
}

export function useAssignEmployees() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ departmentId, employeeIds }: { departmentId: string; employeeIds: string[] }) =>
      departmentApi.assignEmployees(departmentId, employeeIds),
    onSuccess: (_, { departmentId }) => {
      queryClient.invalidateQueries({ queryKey: departmentKeys.employees(departmentId) });
      queryClient.invalidateQueries({ queryKey: departmentKeys.detail(departmentId) });
      toast({
        title: 'Success',
        description: 'Employees assigned successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to assign employees',
        variant: 'destructive',
      });
    },
  });
}

export function useAdjustBudget() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ departmentId, adjustment }: { departmentId: string; adjustment: BudgetAdjustment }) =>
      departmentApi.adjustBudget(departmentId, adjustment),
    onSuccess: (_, { departmentId }) => {
      queryClient.invalidateQueries({ queryKey: departmentKeys.detail(departmentId) });
      queryClient.invalidateQueries({ queryKey: departmentKeys.budget(departmentId) });
      toast({
        title: 'Success',
        description: 'Budget adjusted successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to adjust budget',
        variant: 'destructive',
      });
    },
  });
}

export function useCreateGoal() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ departmentId, goalData }: { departmentId: string; goalData: Omit<DepartmentGoal, 'id'> }) =>
      departmentApi.createGoal(departmentId, goalData),
    onSuccess: (_, { departmentId }) => {
      queryClient.invalidateQueries({ queryKey: departmentKeys.goals(departmentId) });
      queryClient.invalidateQueries({ queryKey: departmentKeys.detail(departmentId) });
      toast({
        title: 'Success',
        description: 'Goal created successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create goal',
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateGoal() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ 
      departmentId, 
      goalId, 
      goalData 
    }: { 
      departmentId: string; 
      goalId: string; 
      goalData: Partial<DepartmentGoal> 
    }) => departmentApi.updateGoal(departmentId, goalId, goalData),
    onSuccess: (_, { departmentId }) => {
      queryClient.invalidateQueries({ queryKey: departmentKeys.goals(departmentId) });
      toast({
        title: 'Success',
        description: 'Goal updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update goal',
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteGoal() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ departmentId, goalId }: { departmentId: string; goalId: string }) =>
      departmentApi.deleteGoal(departmentId, goalId),
    onSuccess: (_, { departmentId }) => {
      queryClient.invalidateQueries({ queryKey: departmentKeys.goals(departmentId) });
      queryClient.invalidateQueries({ queryKey: departmentKeys.detail(departmentId) });
      toast({
        title: 'Success',
        description: 'Goal deleted successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete goal',
        variant: 'destructive',
      });
    },
  });
}