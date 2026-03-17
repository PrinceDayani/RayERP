import { useQuery } from '@tanstack/react-query';
import tasksAPI from '@/lib/api/tasksAPI';

interface AnalyticsFilters {
  projectId?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
}

export const useProjectAnalytics = (filters: AnalyticsFilters = {}) => {
  const { projectId, userId, startDate, endDate } = filters;

  const { data: analytics, isLoading: isLoadingAnalytics, refetch: refetchAnalytics } = useQuery({
    queryKey: ['task-analytics', projectId, userId, startDate, endDate],
    queryFn: () => tasksAPI.getAnalytics(projectId, userId, startDate, endDate),
    enabled: !!(projectId || userId)
  });

  const { data: productivityMetrics, isLoading: isLoadingProductivity, refetch: refetchProductivity } = useQuery({
    queryKey: ['productivity-metrics', userId, startDate, endDate],
    queryFn: () => tasksAPI.getProductivityMetrics(userId!, startDate, endDate),
    enabled: !!userId
  });

  const { data: projectAnalytics, isLoading: isLoadingProject, refetch: refetchProject } = useQuery({
    queryKey: ['project-analytics', projectId],
    queryFn: () => tasksAPI.getProjectAnalytics(projectId!),
    enabled: !!projectId
  });

  return {
    analytics,
    productivityMetrics,
    projectAnalytics,
    isLoadingAnalytics,
    isLoadingProductivity,
    isLoadingProject,
    isLoading: isLoadingAnalytics || isLoadingProductivity || isLoadingProject,
    refetchAnalytics,
    refetchProductivity,
    refetchProject,
    refetchAll: () => {
      refetchAnalytics();
      refetchProductivity();
      refetchProject();
    }
  };
};
