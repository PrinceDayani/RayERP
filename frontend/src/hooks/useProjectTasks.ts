import { useState, useEffect, useCallback } from 'react';
import { projectsAPI, Task } from '@/lib/api/projectsAPI';
import { useAuth } from '@/contexts/AuthContext';

export const useProjectTasks = (projectId: string) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch tasks for the project
  const fetchTasks = useCallback(async () => {
    if (!projectId) return;
    
    try {
      setLoading(true);
      setError(null);
      const tasksData = await projectsAPI.getTasks(projectId);
      setTasks(tasksData || []);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError('Failed to fetch tasks');
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // Create a new task
  const createTask = useCallback(async (taskData: Partial<Task>) => {
    if (!projectId || !user) return;

    try {
      setError(null);
      const assignedToValue = typeof taskData.assignedTo === 'string' 
        ? taskData.assignedTo 
        : (typeof taskData.assignedTo === 'object' && taskData.assignedTo?._id) 
          ? taskData.assignedTo._id 
          : user._id;
      
      const newTask = await projectsAPI.createTask(projectId, {
        ...taskData,
        assignedTo: assignedToValue,
        assignedBy: user._id,
      } as any);
      
      setTasks(prev => [...prev, newTask]);
      return newTask;
    } catch (err) {
      console.error('Error creating task:', err);
      setError('Failed to create task');
      throw err;
    }
  }, [projectId, user]);

  // Update a task
  const updateTask = useCallback(async (taskId: string, taskData: Partial<Task>) => {
    if (!projectId || !user) return;

    try {
      setError(null);
      const updatedTask = await projectsAPI.updateTask(projectId, taskId, {
        ...taskData,
      } as any);
      
      setTasks(prev => prev.map(task => 
        task._id === taskId ? updatedTask : task
      ));
      return updatedTask;
    } catch (err) {
      console.error('Error updating task:', err);
      setError('Failed to update task');
      throw err;
    }
  }, [projectId, user]);

  // Delete a task
  const deleteTask = useCallback(async (taskId: string) => {
    if (!projectId || !user) return;

    try {
      setError(null);
      await projectsAPI.deleteTask(projectId, taskId);
      setTasks(prev => prev.filter(task => task._id !== taskId));
    } catch (err) {
      console.error('Error deleting task:', err);
      setError('Failed to delete task');
      throw err;
    }
  }, [projectId, user]);

  // Initial fetch
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return {
    tasks,
    loading,
    error,
    createTask,
    updateTask,
    deleteTask,
    refetch: fetchTasks,
  };
};