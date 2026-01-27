/**
 * Project Modules Index
 * 
 * Centralized exports for all project modules
 * Use this for importing module functionality across the application
 */

// Task Module
export * from './tasks/taskController';
export { default as taskRoutes } from './tasks/taskRoutes';

// Budget Module
export { default as budgetRoutes } from './budget/budgetRoutes';

// Timeline Module
export * from './timeline/timelineController';
export { default as timelineRoutes } from './timeline/timelineRoutes';

// Files Module
export * from './files/fileController';
export { default as fileRoutes } from './files/fileRoutes';

// Finance Module
export * from './finance/financeController';
export { default as financeRoutes } from './finance/financeRoutes';

// Permissions Module
export * from './permissions/permissionController';
export { default as permissionRoutes } from './permissions/permissionRoutes';

// Activity Module
export * from './activity/activityController';
export { default as activityRoutes } from './activity/activityRoutes';
