import { useCallback } from 'react';
import { useTaskContext } from '@/contexts/TaskContext';

export function useTaskSelection() {
  const { state, actions } = useTaskContext();

  const selectTask = useCallback((taskId: string) => {
    actions.toggleTaskSelection(taskId);
  }, [actions]);

  const selectAll = useCallback(() => {
    const allTaskIds = state.tasks.map(task => task._id);
    actions.setSelectedTasks(allTaskIds);
  }, [actions, state.tasks]);

  const deselectAll = useCallback(() => {
    actions.setSelectedTasks([]);
  }, [actions]);

  const selectMultiple = useCallback((taskIds: string[]) => {
    actions.setSelectedTasks(taskIds);
  }, [actions]);

  const isSelected = useCallback((taskId: string) => {
    return state.selectedTasks.includes(taskId);
  }, [state.selectedTasks]);

  const getSelectedCount = useCallback(() => {
    return state.selectedTasks.length;
  }, [state.selectedTasks]);

  const hasSelection = useCallback(() => {
    return state.selectedTasks.length > 0;
  }, [state.selectedTasks]);

  return {
    selectedTasks: state.selectedTasks,
    selectTask,
    selectAll,
    deselectAll,
    selectMultiple,
    isSelected,
    getSelectedCount,
    hasSelection,
  };
}
