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