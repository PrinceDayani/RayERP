import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import tasksAPI from '@/lib/api/tasksAPI';
import { toast } from 'sonner';

export const useProjectTaskDependencies = (taskId?: string, projectId?: string) => {
  const queryClient = useQueryClient();

  const { data: dependencyGraph, isLoading: isLoadingGraph } = useQuery({
    queryKey: ['dependency-graph', projectId],
    queryFn: () => tasksAPI.getDependencyGraph(projectId),
    enabled: !!projectId
  });

  const { data: criticalPath, isLoading: isLoadingCriticalPath } = useQuery({
    queryKey: ['critical-path', projectId],
    queryFn: () => tasksAPI.getCriticalPath(projectId!),
    enabled: !!projectId
  });

  const { data: blockedInfo, isLoading: isLoadingBlocked } = useQuery({
    queryKey: ['blocked-tasks', taskId],
    queryFn: () => tasksAPI.checkBlocked(taskId!),
    enabled: !!taskId
  });

  const addDependencyMutation = useMutation({
    mutationFn: ({ taskId, dependsOn, type }: { taskId: string; dependsOn: string; type?: string }) =>
      tasksAPI.addDependency(taskId, dependsOn, type),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task'] });
      queryClient.invalidateQueries({ queryKey: ['dependency-graph'] });
      queryClient.invalidateQueries({ queryKey: ['critical-path'] });
      toast.success('Dependency added successfully');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to add dependency');
    }
  });

  const removeDependencyMutation = useMutation({
    mutationFn: ({ taskId, dependencyId }: { taskId: string; dependencyId: string }) =>
      tasksAPI.removeDependency(taskId, dependencyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task'] });
      queryClient.invalidateQueries({ queryKey: ['dependency-graph'] });
      queryClient.invalidateQueries({ queryKey: ['critical-path'] });
      toast.success('Dependency removed successfully');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to remove dependency');
    }
  });

  return {
    dependencyGraph,
    criticalPath,
    blockedInfo,
    isLoadingGraph,
    isLoadingCriticalPath,
    isLoadingBlocked,
    addDependency: addDependencyMutation.mutateAsync,
    removeDependency: removeDependencyMutation.mutateAsync,
    isAddingDependency: addDependencyMutation.isPending,
    isRemovingDependency: removeDependencyMutation.isPending
  };
};
