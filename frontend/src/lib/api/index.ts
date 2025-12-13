// Direct exports from api modules
import apiInstance, { apiRequest as apiRequestFn } from './api';
import authAPIModule from './authAPI';
import employeesAPIModule from './employeesAPI';
import contactsAPIModule from './contactsAPI';
import analyticsAPIModule from './analyticsAPI';
import trendsAPIModule from './trendsAPI';
import reportsAPIModule from './reportsAPI';
import settingsAPIModule from './settingsAPI';
import projectsAPIModule from './projectsAPI';
import budgetAPIModule from './budgetAPI';
import activityAPIModule from './activityAPI';
import usersAPIModule from './usersAPI';
import adminAPIModule from './adminAPI';

// Default export
export default apiInstance;

// Named exports
export const api = apiInstance;
export const apiClient = apiInstance;
export const apiRequest = apiRequestFn;
export const authAPI = authAPIModule;
export const employeesAPI = employeesAPIModule;
export const contactsAPI = contactsAPIModule;
export const analyticsAPI = analyticsAPIModule;
export const analyticsApi = analyticsAPIModule;
export const trendsAPI = trendsAPIModule;
export const reportsAPI = reportsAPIModule;
export const settingsAPI = settingsAPIModule;
export const projectsAPI = projectsAPIModule;
export const budgetAPI = budgetAPIModule;
export const activityAPI = activityAPIModule;
export const usersAPI = usersAPIModule;
export const adminAPI = adminAPIModule;

// Re-export types
export type { User, CreateUserData, UpdateUserData, StatusChangeRequest } from './usersAPI';
export type { Employee } from './employeesAPI';
export type { AnalyticsResponse } from './analyticsAPI';
export type { Contact, ContactFilterOptions, ContactStats, ContactFilterParams } from './contactsAPI';

// Re-export functions from contactsAPI
export { getContacts, getContact, createContact, updateContact, deleteContact, searchContacts, filterContacts, getContactStats } from './contactsAPI';

// Re-export functions from employeesAPI
export { getAllEmployees } from './employeesAPI';

// Re-export functions from settingsAPI
export { getSettings } from './settingsAPI';
