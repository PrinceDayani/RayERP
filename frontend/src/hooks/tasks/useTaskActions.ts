import { useCallback } from 'react';
import { useTaskContext } from '@/contexts/TaskContext';
import { Task } from '@/lib/api/tasksAPI';

export function useTaskActions() {
  const { actions } = useTaskContext();

  const createTask = useCallback(async (taskData: any) => {
    return await actions.createTask(taskData);
  }, [actions]);

  const updateTask = useCallback(async (id: string, updates: any) => {
    return await actions.updateTask(id, updates);
  }, [actions]);

  const deleteTask = useCallback(async (id: string) => {
    await actions.deleteTask(id);
  }, [actions]);

  const updateTaskStatus = useCallback(async (id: string, status: string) => {
    return await actions.updateTask(id, { status });
  }, [actions]);

  const bulkUpdateStatus = useCallback(async (status: string) => {
    await actions.bulkUpdateStatus(status);
  }, [actions]);

  const bulkDelete = useCallback(async () => {
    await actions.bulkDelete();
  }, [actions]);

  return {
    createTask,
    updateTask,
    deleteTask,
    updateTaskStatus,
    bulkUpdateStatus,
    bulkDelete,
  };
}
