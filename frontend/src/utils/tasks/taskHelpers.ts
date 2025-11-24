import { Task } from '@/lib/api/tasksAPI';
import { TaskPriority, TaskStatus } from '@/types/tasks';

export const getPriorityColor = (priority: TaskPriority): string => {
  switch (priority) {
    case 'critical': return 'bg-red-100 text-red-800';
    case 'high': return 'bg-orange-100 text-orange-800';
    case 'medium': return 'bg-yellow-100 text-yellow-800';
    case 'low': return 'bg-green-100 text-green-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export const getStatusColor = (status: TaskStatus): string => {
  switch (status) {
    case 'todo': return 'bg-gray-100 text-gray-800';
    case 'in-progress': return 'bg-blue-100 text-blue-800';
    case 'review': return 'bg-yellow-100 text-yellow-800';
    case 'completed': return 'bg-green-100 text-green-800';
    case 'blocked': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export const isTaskOverdue = (task: Task): boolean => {
  if (!task.dueDate) return false;
  return new Date(task.dueDate) < new Date() && task.status !== 'completed';
};

export const formatTaskDueDate = (dueDate: string): string => {
  return new Date(dueDate).toLocaleDateString();
};

export const getTaskAssigneeName = (task: Task): string => {
  if (typeof task.assignedTo === 'object' && task.assignedTo) {
    return `${task.assignedTo.firstName || 'Unknown'} ${task.assignedTo.lastName || 'User'}`;
  }
  return 'Unknown User';
};

export const getTaskProjectName = (task: Task): string => {
  if (typeof task.project === 'object' && task.project) {
    return task.project.name || 'Unknown Project';
  }
  return 'Unknown Project';
};

export const calculateTaskProgress = (task: Task): number => {
  if (task.status === 'completed') return 100;
  if (task.status === 'in-progress') return 50;
  if (task.status === 'review') return 75;
  return 0;
};

export const sortTasksByPriority = (tasks: Task[]): Task[] => {
  const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
  return [...tasks].sort((a, b) => {
    return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
  });
};

export const sortTasksByDueDate = (tasks: Task[]): Task[] => {
  return [...tasks].sort((a, b) => {
    if (!a.dueDate && !b.dueDate) return 0;
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });
};

export const groupTasksByStatus = (tasks: Task[]) => {
  return {
    todo: tasks.filter(t => t.status === 'todo'),
    'in-progress': tasks.filter(t => t.status === 'in-progress'),
    review: tasks.filter(t => t.status === 'review'),
    completed: tasks.filter(t => t.status === 'completed'),
  };
};

export const exportTasksToCSV = (tasks: Task[]): void => {
  const csv = [
    ['Title', 'Status', 'Priority', 'Assignee', 'Project', 'Due Date', 'Estimated Hours'].join(','),
    ...tasks.map(task => [
      task.title,
      task.status,
      task.priority,
      getTaskAssigneeName(task),
      getTaskProjectName(task),
      task.dueDate ? formatTaskDueDate(task.dueDate) : 'N/A',
      task.estimatedHours || 0
    ].join(','))
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `tasks-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
};
