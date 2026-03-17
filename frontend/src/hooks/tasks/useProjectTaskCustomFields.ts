import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import tasksAPI from '@/lib/api/tasksAPI';
import { toast } from 'sonner';

interface CustomField {
  fieldName: string;
  fieldType: 'text' | 'number' | 'date' | 'select' | 'multiselect';
  value: any;
  options?: string[];
}

export const useProjectTaskCustomFields = (taskId: string) => {
  const queryClient = useQueryClient();

  const addCustomFieldMutation = useMutation({
    mutationFn: (field: CustomField) => tasksAPI.addCustomField(taskId, field),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      toast.success('Custom field added successfully');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to add custom field');
    }
  });

  const updateCustomFieldMutation = useMutation({
    mutationFn: ({ fieldName, value }: { fieldName: string; value: any }) =>
      tasksAPI.updateCustomField(taskId, fieldName, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      toast.success('Custom field updated successfully');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to update custom field');
    }
  });

  const removeCustomFieldMutation = useMutation({
    mutationFn: (fieldName: string) => tasksAPI.removeCustomField(taskId, fieldName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      toast.success('Custom field removed successfully');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to remove custom field');
    }
  });

  return {
    addCustomField: addCustomFieldMutation.mutateAsync,
    updateCustomField: (fieldName: string, value: any) =>
      updateCustomFieldMutation.mutateAsync({ fieldName, value }),
    removeCustomField: removeCustomFieldMutation.mutateAsync,
    isAdding: addCustomFieldMutation.isPending,
    isUpdating: updateCustomFieldMutation.isPending,
    isRemoving: removeCustomFieldMutation.isPending
  };
};
