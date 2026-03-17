import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import tasksAPI from '@/lib/api/tasksAPI';
import { toast } from 'sonner';

export const useProjectTaskTemplates = () => {
  const queryClient = useQueryClient();

  const { data: templates, isLoading } = useQuery({
    queryKey: ['task-templates'],
    queryFn: () => tasksAPI.getTemplates()
  });

  const saveAsTemplateMutation = useMutation({
    mutationFn: ({ taskId, templateName }: { taskId: string; templateName: string }) =>
      tasksAPI.saveAsTemplate(taskId, templateName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-templates'] });
      toast.success('Template saved successfully');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to save template');
    }
  });

  const createFromTemplateMutation = useMutation({
    mutationFn: ({ templateId, data }: { templateId: string; data: any }) =>
      tasksAPI.createFromTemplate(templateId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task created from template');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to create from template');
    }
  });

  const updateTemplateMutation = useMutation({
    mutationFn: ({ templateId, data }: { templateId: string; data: any }) =>
      tasksAPI.updateTemplate(templateId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-templates'] });
      toast.success('Template updated successfully');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to update template');
    }
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: (templateId: string) => tasksAPI.deleteTemplate(templateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-templates'] });
      toast.success('Template deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to delete template');
    }
  });

  return {
    templates,
    isLoading,
    saveAsTemplate: saveAsTemplateMutation.mutateAsync,
    createFromTemplate: createFromTemplateMutation.mutateAsync,
    updateTemplate: updateTemplateMutation.mutateAsync,
    deleteTemplate: deleteTemplateMutation.mutateAsync,
    isSaving: saveAsTemplateMutation.isPending,
    isCreating: createFromTemplateMutation.isPending,
    isUpdating: updateTemplateMutation.isPending,
    isDeleting: deleteTemplateMutation.isPending
  };
};
