import { useMutation, useQueryClient } from '@tanstack/react-query';
import tasksAPI from '@/lib/api/tasksAPI';
import { toast } from 'sonner';

export const useBulkOperations = () => {
  const queryClient = useQueryClient();

  const bulkDeleteMutation = useMutation({
    mutationFn: (taskIds: string[]) => tasksAPI.bulkDelete(taskIds),
    onSuccess: (_, taskIds) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success(`${taskIds.length} task(s) deleted successfully`);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to delete tasks');
    }
  });

  const bulkAssignMutation = useMutation({
    mutationFn: ({ taskIds, assignedTo }: { taskIds: string[]; assignedTo: string }) =>
      tasksAPI.bulkAssign(taskIds, assignedTo),
    onSuccess: (_, { taskIds }) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success(`${taskIds.length} task(s) reassigned successfully`);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to assign tasks');
    }
  });

  const bulkStatusMutation = useMutation({
    mutationFn: ({ taskIds, status }: { taskIds: string[]; status: string }) =>
      tasksAPI.bulkStatusChange(taskIds, status),
    onSuccess: (_, { taskIds }) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success(`${taskIds.length} task(s) status updated successfully`);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to update status');
    }
  });

  const bulkPriorityMutation = useMutation({
    mutationFn: ({ taskIds, priority }: { taskIds: string[]; priority: string }) =>
      tasksAPI.bulkPriorityChange(taskIds, priority),
    onSuccess: (_, { taskIds }) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success(`${taskIds.length} task(s) priority updated successfully`);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to update priority');
    }
  });

  const bulkAddTagsMutation = useMutation({
    mutationFn: ({ taskIds, tags }: { taskIds: string[]; tags: Array<{ name: string; color: string }> }) =>
      tasksAPI.bulkAddTags(taskIds, tags),
    onSuccess: (_, { taskIds }) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success(`Tags added to ${taskIds.length} task(s) successfully`);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to add tags');
    }
  });

  const bulkSetDueDateMutation = useMutation({
    mutationFn: ({ taskIds, dueDate }: { taskIds: string[]; dueDate: string }) =>
      tasksAPI.bulkSetDueDate(taskIds, dueDate),
    onSuccess: (_, { taskIds }) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success(`Due date set for ${taskIds.length} task(s) successfully`);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to set due date');
    }
  });

  const bulkCloneMutation = useMutation({
    mutationFn: (taskIds: string[]) => tasksAPI.bulkClone(taskIds),
    onSuccess: (_, taskIds) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success(`${taskIds.length} task(s) cloned successfully`);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to clone tasks');
    }
  });

  const bulkArchiveMutation = useMutation({
    mutationFn: (taskIds: string[]) => tasksAPI.bulkArchive(taskIds),
    onSuccess: (_, taskIds) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success(`${taskIds.length} task(s) archived successfully`);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to archive tasks');
    }
  });

  return {
    bulkDelete: bulkDeleteMutation.mutateAsync,
    bulkAssign: (taskIds: string[], assignedTo: string) =>
      bulkAssignMutation.mutateAsync({ taskIds, assignedTo }),
    bulkStatus: (taskIds: string[], status: string) =>
      bulkStatusMutation.mutateAsync({ taskIds, status }),
    bulkPriority: (taskIds: string[], priority: string) =>
      bulkPriorityMutation.mutateAsync({ taskIds, priority }),
    bulkAddTags: (taskIds: string[], tags: Array<{ name: string; color: string }>) =>
      bulkAddTagsMutation.mutateAsync({ taskIds, tags }),
    bulkSetDueDate: (taskIds: string[], dueDate: string) =>
      bulkSetDueDateMutation.mutateAsync({ taskIds, dueDate }),
    bulkClone: bulkCloneMutation.mutateAsync,
    bulkArchive: bulkArchiveMutation.mutateAsync,
    isDeleting: bulkDeleteMutation.isPending,
    isAssigning: bulkAssignMutation.isPending,
    isUpdatingStatus: bulkStatusMutation.isPending,
    isUpdatingPriority: bulkPriorityMutation.isPending,
    isAddingTags: bulkAddTagsMutation.isPending,
    isSettingDueDate: bulkSetDueDateMutation.isPending,
    isCloning: bulkCloneMutation.isPending,
    isArchiving: bulkArchiveMutation.isPending
  };
};
