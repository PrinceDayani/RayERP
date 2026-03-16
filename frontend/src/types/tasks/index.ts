// Task-related type definitions

export interface TaskFilters {
  search: string;
  status: string;
  priority: string;
  project: string;
  assignee: string;
  taskType?: 'individual' | 'project' | '';
  assignmentType?: 'assigned' | 'self-assigned' | '';
}

export interface TaskStats {
  total: number;
  completed: number;
  inProgress: number;
  overdue: number;
  completionRate: number;
  individualTasks?: number;
  projectTasks?: number;
  selfAssigned?: number;
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
export type TaskType = 'individual' | 'project';
export type AssignmentType = 'assigned' | 'self-assigned';

export interface TaskFormData {
  title: string;
  description: string;
  taskType: TaskType;
  assignmentType: AssignmentType;
  project?: string;
  priority: TaskPriority;
  dueDate: string;
  estimatedHours: string;
  assignedTo: string;
  assignedBy: string;
}

export interface Tag {
  name: string;
  color: string;
}

export interface ChecklistItem {
  _id?: string;
  text: string;
  completed: boolean;
  completedBy?: string;
  completedAt?: Date;
}

export interface TimeEntry {
  user: string;
  startTime: Date;
  endTime?: Date;
  duration: number;
  description?: string;
}

export interface Attachment {
  _id?: string;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  url: string;
  uploadedBy: string;
  uploadedAt: Date;
}

export interface Dependency {
  taskId: string;
  type: 'finish-to-start' | 'start-to-start' | 'finish-to-finish' | 'start-to-finish';
}
