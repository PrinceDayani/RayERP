// path: frontend/src/lib/api/index.ts
// This file exports all API functions for easy importing

// Import base API
import api from './api';


// Import default exports from API modules
import authAPIDefault from './authAPI';
import employeesAPIDefault from './employeesAPI';
import contactsAPIDefault from './contactsAPI';
import analyticsAPIDefault from './analyticsAPI';
import reportsAPIDefault from './reportsAPI';
import settingsAPIDefault from './settingsAPI';
import adminAPIDefault from './adminAPI'; // Added admin API import
import projectsAPIDefault from './projectsAPI';
import budgetAPIDefault from './budgetAPI';
import activityAPIDefault from './activityAPI';

// Re-export the base API instance
export { api };

// Re-export the default exports with consistent naming
export {
  authAPIDefault as authAPI,
  employeesAPIDefault as employeesAPI,
  contactsAPIDefault as contactsAPI,
  analyticsAPIDefault as analyticsAPI,
  reportsAPIDefault as reportsAPI,
  settingsAPIDefault as settingsAPI,
  projectsAPIDefault as projectsAPI,
  budgetAPIDefault as budgetAPI,
  activityAPIDefault as activityAPI
};

export { default as adminAPI } from './adminAPI';

// Re-export individual functions and types
// Auth API exports
export * from './authAPI';

// Employees API exports
export * from './employeesAPI';

// Contacts API exports
export * from './contactsAPI';

// Analytics API exports
export * from './analyticsAPI';

// Reports API exports
export * from './reportsAPI';

// Settings API exports
export * from './settingsAPI';

// Admin API exports
export * from './adminAPI';

// Projects API exports
export * from './projectsAPI';

// Budget API exports
export * from './budgetAPI';

// Activity API exports (excluding ActivityLog to avoid conflict)
export { default as activityAPIDefault } from './activityAPI';

// Export a combined API object as default
const combinedAPI = {
  api,
  auth: authAPIDefault,
  employees: employeesAPIDefault,
  contacts: contactsAPIDefault,
  analytics: analyticsAPIDefault,
  reports: reportsAPIDefault,
  settings: settingsAPIDefault,
  admin: adminAPIDefault, // Added admin to combined API
  projects: projectsAPIDefault,
  budgets: budgetAPIDefault,
  activity: activityAPIDefault
};

export default combinedAPI;