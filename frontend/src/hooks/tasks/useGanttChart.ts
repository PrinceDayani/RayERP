import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import tasksAPI from '@/lib/api/tasksAPI';
import { toast } from 'sonner';

export const useGanttChart = (projectId: string) => {
  const queryClient = useQueryClient();

  const { data: ganttData, isLoading, refetch } = useQuery({
    queryKey: ['gantt-data', projectId],
    queryFn: () => tasksAPI.getGanttData(projectId),
    enabled: !!projectId
  });

  const updateGanttTaskMutation = useMutation({
    mutationFn: ({ taskId, data }: { taskId: string; data: { start_date?: string; end_date?: string; progress?: number } }) =>
      tasksAPI.updateGanttTask(taskId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gantt-data', projectId] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task updated successfully');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to update task');
    }
  });

  return {
    ganttData,
    isLoading,
    refetch,
    updateGanttTask: updateGanttTaskMutation.mutateAsync,
    isUpdating: updateGanttTaskMutation.isPending
  };
};
