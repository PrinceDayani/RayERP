import { io } from '../server';

/**
 * Socket Event Emitter Utility Functions
 * 
 * These functions can be called from your controllers to emit
 * real-time updates to connected clients
 */

// Contact events
export const emitContactUpdated = (contact: any) => {
  io.emit('contact:updated', contact);
};

// Dashboard refresh event (force clients to reload dashboard data)
export const emitDashboardRefresh = () => {
  io.emit('dashboard:refresh');
};

// Employee events
export const emitEmployeeUpdated = (employee: any) => {
  io.emit('employee:updated', employee);
};

// Project events
export const emitProjectUpdated = (project: any) => {
  io.emit('project:updated', project);
};

// Task events
export const emitTaskUpdated = (task: any) => {
  io.emit('task:updated', task);
};

// Attendance events
export const emitAttendanceUpdated = (attendance: any) => {
  io.emit('attendance:updated', attendance);
};

// Analytics events
export const emitAnalyticsUpdated = (metrics: any) => {
  io.emit('analytics:updated', metrics);
};

// Project/task rollup stats. Debounced because task mutations arrive in bursts
// (bulk updates, reorder, cascade) and each one previously triggered six
// sequential countDocuments calls.
const PROJECT_STATS_DEBOUNCE_MS = 1000;
let projectStatsTimer: NodeJS.Timeout | null = null;

const computeProjectStats = async () => {
  const Project = (await import('../models/Project')).default;
  const Task = (await import('../models/Task')).default;

  const [
    totalProjects,
    activeProjects,
    completedProjects,
    totalTasks,
    completedTasks,
    overdueTasks
  ] = await Promise.all([
    Project.countDocuments({}),
    Project.countDocuments({ status: 'active' }),
    Project.countDocuments({ status: 'completed' }),
    Task.countDocuments({}),
    Task.countDocuments({ status: 'completed' }),
    Task.countDocuments({ dueDate: { $lt: new Date() }, status: { $ne: 'completed' } })
  ]);

  return { totalProjects, activeProjects, completedProjects, totalTasks, completedTasks, overdueTasks };
};

export const emitProjectStats = async (): Promise<void> => {
  if (projectStatsTimer) return;

  projectStatsTimer = setTimeout(async () => {
    projectStatsTimer = null;
    try {
      io.emit('project:stats', await computeProjectStats());
    } catch (error: any) {
      const { logger } = await import('./logger');
      logger.error('Error emitting project stats', { message: error?.message });
    }
  }, PROJECT_STATS_DEBOUNCE_MS);

  if (typeof projectStatsTimer.unref === 'function') projectStatsTimer.unref();
};