import { useCallback } from 'react';
import { useTaskContext } from '@/contexts/TaskContext';

export function useTaskFilters() {
  const { state, actions } = useTaskContext();

  const setSearch = useCallback((search: string) => {
    actions.setFilters({ search });
  }, [actions]);

  const setStatus = useCallback((status: string) => {
    actions.setFilters({ status });
  }, [actions]);

  const setPriority = useCallback((priority: string) => {
    actions.setFilters({ priority });
  }, [actions]);

  const setProject = useCallback((project: string) => {
    actions.setFilters({ project });
  }, [actions]);

  const setAssignee = useCallback((assignee: string) => {
    actions.setFilters({ assignee });
  }, [actions]);

  const clearFilters = useCallback(() => {
    actions.setFilters({
      search: '',
      status: 'all',
      priority: 'all',
      project: 'all',
      assignee: 'all',
    });
  }, [actions]);

  const setMultipleFilters = useCallback((filters: Record<string, string>) => {
    actions.setFilters(filters);
  }, [actions]);

  return {
    filters: state.filters,
    setSearch,
    setStatus,
    setPriority,
    setProject,
    setAssignee,
    clearFilters,
    setMultipleFilters,
  };
}