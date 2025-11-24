// Task-related type definitions

export interface TaskFilters {
  search: string;
  status: string;
  priority: string;
  project: string;
  assignee: string;
}

export interface TaskStats {
  total: number;
  completed: number;
  inProgress: number;
  overdue: number;
  completionRate: number;
}

export interface TaskDialogState {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export interface TaskEditDialogState extends TaskDialogState {
  task: any | null;
}

export interface TaskCommentDialogState extends TaskDialogState {
  task: any | null;
}

export interface TaskBoardProps {
  onEditTask: (task: any) => void;
  onCommentTask: (task: any) => void;
}

export interface TaskDialogsProps {
  createDialog: TaskDialogState;
  editDialog: TaskEditDialogState;
  commentDialog: TaskCommentDialogState;
}

export type TaskStatus = 'todo' | 'in-progress' | 'review' | 'completed' | 'blocked';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export interface TaskFormData {
  title: string;
  description: string;
  project: string;
  priority: TaskPriority;
  dueDate: string;
  estimatedHours: string;
}