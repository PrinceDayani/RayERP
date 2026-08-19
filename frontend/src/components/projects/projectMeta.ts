import type { Project } from "@/lib/api/projectsAPI";

export const PROJECT_STATUSES = [
  { value: 'planning', label: 'Planning' },
  { value: 'active', label: 'Active' },
  { value: 'on-hold', label: 'On Hold' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'archived', label: 'Archived' }
] as const;

export const PROJECT_PRIORITIES = [
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' }
] as const;

export const TASK_STATUSES = [
  { value: 'todo', label: 'To Do' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'review', label: 'Review' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'completed', label: 'Completed' }
] as const;

const STATUS_COLORS: Record<string, string> = {
  planning: 'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/25 dark:text-violet-300 dark:border-violet-800',
  active: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/25 dark:text-emerald-300 dark:border-emerald-800',
  'on-hold': 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/25 dark:text-amber-300 dark:border-amber-800',
  completed: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/25 dark:text-blue-300 dark:border-blue-800',
  cancelled: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/25 dark:text-red-300 dark:border-red-800',
  archived: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700'
};

const PRIORITY_COLORS: Record<string, string> = {
  critical: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/25 dark:text-red-300 dark:border-red-800',
  high: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/25 dark:text-orange-300 dark:border-orange-800',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/25 dark:text-yellow-300 dark:border-yellow-800',
  low: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700'
};

// Solid fills for the priority tile on a project card.
const PRIORITY_ACCENTS: Record<string, string> = {
  critical: 'bg-red-500 text-white',
  high: 'bg-orange-500 text-white',
  medium: 'bg-yellow-500 text-white',
  low: 'bg-emerald-500 text-white'
};

const TASK_STATUS_COLORS: Record<string, string> = {
  todo: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700',
  'in-progress': 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/25 dark:text-blue-300 dark:border-blue-800',
  review: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/25 dark:text-amber-300 dark:border-amber-800',
  blocked: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/25 dark:text-red-300 dark:border-red-800',
  completed: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/25 dark:text-emerald-300 dark:border-emerald-800'
};

const FALLBACK = 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700';

export const statusColor = (status?: string): string => STATUS_COLORS[status || ''] || FALLBACK;
export const priorityColor = (priority?: string): string => PRIORITY_COLORS[priority || ''] || FALLBACK;
export const priorityAccent = (priority?: string): string => PRIORITY_ACCENTS[priority || ''] || 'bg-slate-500 text-white';
export const taskStatusColor = (status?: string): string => TASK_STATUS_COLORS[status || ''] || FALLBACK;

export const labelFor = (value?: string): string =>
  (value || '').split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');

/** Statuses that mean the project is closed out, so a past end date is not late. */
export const CLOSED_STATUSES = ['completed', 'cancelled', 'archived'];

export const isOverdue = (project: Pick<Project, 'endDate' | 'status'>): boolean =>
  !!project.endDate &&
  !CLOSED_STATUSES.includes(project.status) &&
  new Date(project.endDate).getTime() < Date.now();

/** Whole days until the end date; negative once it has passed. */
export const daysRemaining = (endDate?: string): number | null => {
  if (!endDate) return null;
  const end = new Date(endDate).getTime();
  if (Number.isNaN(end)) return null;
  return Math.ceil((end - Date.now()) / 86_400_000);
};

export const formatDate = (value?: string): string => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
};

/** The API returns a reduced document for department-level visibility. */
export const isBasicView = (project: Project): boolean => (project as any).isBasicView === true;
