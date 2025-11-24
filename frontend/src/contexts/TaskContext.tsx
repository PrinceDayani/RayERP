'use client';

import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { useSocket } from '@/hooks/useSocket';
import tasksAPI, { Task } from '@/lib/api/tasksAPI';

interface TaskState {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  filters: {
    search: string;
    status: string;
    priority: string;
    project: string;
    assignee: string;
  };
  selectedTasks: string[];
}

type TaskAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_TASKS'; payload: Task[] }
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'UPDATE_TASK'; payload: Task }
  | { type: 'DELETE_TASK'; payload: string }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_FILTERS'; payload: Partial<TaskState['filters']> }
  | { type: 'SET_SELECTED_TASKS'; payload: string[] }
  | { type: 'TOGGLE_TASK_SELECTION'; payload: string };

const initialState: TaskState = {
  tasks: [],
  loading: false,
  error: null,
  filters: {
    search: '',
    status: 'all',
    priority: 'all',
    project: 'all',
    assignee: 'all',
  },
  selectedTasks: [],
};

function taskReducer(state: TaskState, action: TaskAction): TaskState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_TASKS':
      return { ...state, tasks: action.payload, loading: false };
    case 'ADD_TASK':
      // Prevent duplicate tasks
      if (state.tasks.some(t => t._id === action.payload._id)) {
        return state;
      }
      return { ...state, tasks: [...state.tasks, action.payload] };
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task._id === action.payload._id ? action.payload : task
        ),
      };
    case 'DELETE_TASK':
      return {
        ...state,
        tasks: state.tasks.filter(task => task._id !== action.payload),
        selectedTasks: state.selectedTasks.filter(id => id !== action.payload),
      };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'SET_FILTERS':
      return { ...state, filters: { ...state.filters, ...action.payload } };
    case 'SET_SELECTED_TASKS':
      return { ...state, selectedTasks: action.payload };
    case 'TOGGLE_TASK_SELECTION':
      return {
        ...state,
        selectedTasks: state.selectedTasks.includes(action.payload)
          ? state.selectedTasks.filter(id => id !== action.payload)
          : [...state.selectedTasks, action.payload],
      };
    default:
      return state;
  }
}

interface TaskContextType {
  state: TaskState;
  actions: {
    fetchTasks: () => Promise<void>;
    createTask: (taskData: any) => Promise<Task>;
    updateTask: (id: string, updates: any) => Promise<Task>;
    updateTaskLocal: (task: Task) => void;
    deleteTask: (id: string) => Promise<void>;
    setFilters: (filters: Partial<TaskState['filters']>) => void;
    setSelectedTasks: (taskIds: string[]) => void;
    toggleTaskSelection: (taskId: string) => void;
    bulkUpdateStatus: (status: string) => Promise<void>;
    bulkDelete: () => Promise<void>;
  };
  computed: {
    filteredTasks: Task[];
    tasksByStatus: Record<string, Task[]>;
    stats: {
      total: number;
      completed: number;
      inProgress: number;
      overdue: number;
      completionRate: number;
    };
  };
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export function TaskProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(taskReducer, initialState);
  const socket = useSocket();

  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on('task:created', (task: Task) => {
      dispatch({ type: 'ADD_TASK', payload: task });
    });

    socket.on('task:updated', (task: Task) => {
      dispatch({ type: 'UPDATE_TASK', payload: task });
    });

    socket.on('task:deleted', (data: { id: string }) => {
      dispatch({ type: 'DELETE_TASK', payload: data.id });
    });

    return () => {
      socket.off('task:created');
      socket.off('task:updated');
      socket.off('task:deleted');
    };
  }, [socket]);

  const fetchTasks = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const tasks = await tasksAPI.getAll();
      dispatch({ type: 'SET_TASKS', payload: tasks });
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  const createTask = async (taskData: any): Promise<Task> => {
    const task = await tasksAPI.create(taskData);
    dispatch({ type: 'ADD_TASK', payload: task });
    socket?.emit('task:created', task);
    return task;
  };

  const updateTask = async (id: string, updates: any): Promise<Task> => {
    const task = await tasksAPI.update(id, updates);
    dispatch({ type: 'UPDATE_TASK', payload: task });
    socket?.emit('task:updated', task);
    return task;
  };

  const updateTaskLocal = (task: Task) => {
    dispatch({ type: 'UPDATE_TASK', payload: task });
  };

  const deleteTask = async (id: string): Promise<void> => {
    await tasksAPI.delete(id);
    dispatch({ type: 'DELETE_TASK', payload: id });
    socket?.emit('task:deleted', { id });
  };

  const setFilters = (filters: Partial<TaskState['filters']>) => {
    dispatch({ type: 'SET_FILTERS', payload: filters });
  };

  const setSelectedTasks = (taskIds: string[]) => {
    dispatch({ type: 'SET_SELECTED_TASKS', payload: taskIds });
  };

  const toggleTaskSelection = (taskId: string) => {
    dispatch({ type: 'TOGGLE_TASK_SELECTION', payload: taskId });
  };

  const bulkUpdateStatus = async (status: string) => {
    await Promise.all(
      state.selectedTasks.map(id => updateTask(id, { status }))
    );
    setSelectedTasks([]);
  };

  const bulkDelete = async () => {
    await Promise.all(state.selectedTasks.map(deleteTask));
    setSelectedTasks([]);
  };

  // Computed values
  const filteredTasks = state.tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(state.filters.search.toLowerCase()) ||
                         task.description.toLowerCase().includes(state.filters.search.toLowerCase());
    const matchesStatus = state.filters.status === 'all' || task.status === state.filters.status;
    const matchesPriority = state.filters.priority === 'all' || task.priority === state.filters.priority;
    const matchesProject = state.filters.project === 'all' || 
                          (typeof task.project === 'object' && task.project?._id === state.filters.project);
    const matchesAssignee = state.filters.assignee === 'all' || 
                           (typeof task.assignedTo === 'object' && task.assignedTo?._id === state.filters.assignee);
    
    return matchesSearch && matchesStatus && matchesPriority && matchesProject && matchesAssignee;
  });

  const tasksByStatus = {
    todo: filteredTasks.filter(t => t.status === 'todo'),
    'in-progress': filteredTasks.filter(t => t.status === 'in-progress'),
    review: filteredTasks.filter(t => t.status === 'review'),
    completed: filteredTasks.filter(t => t.status === 'completed'),
  };

  const stats = {
    total: state.tasks.length,
    completed: state.tasks.filter(t => t.status === 'completed').length,
    inProgress: state.tasks.filter(t => t.status === 'in-progress').length,
    overdue: state.tasks.filter(t => 
      t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed'
    ).length,
    completionRate: state.tasks.length > 0 
      ? Math.round((state.tasks.filter(t => t.status === 'completed').length / state.tasks.length) * 100) 
      : 0,
  };

  const contextValue: TaskContextType = {
    state,
    actions: {
      fetchTasks,
      createTask,
      updateTask,
      updateTaskLocal,
      deleteTask,
      setFilters,
      setSelectedTasks,
      toggleTaskSelection,
      bulkUpdateStatus,
      bulkDelete,
    },
    computed: {
      filteredTasks,
      tasksByStatus,
      stats,
    },
  };

  return (
    <TaskContext.Provider value={contextValue}>
      {children}
    </TaskContext.Provider>
  );
}

export function useTaskContext() {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTaskContext must be used within a TaskProvider');
  }
  return context;
}
