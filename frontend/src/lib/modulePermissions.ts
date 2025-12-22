// Module Permission Mappings
// This file defines which permissions are required for each module

export const MODULE_PERMISSIONS = {
  // Finance Module
  finance: {
    permissions: ['finance.view', 'finance.manage'],
    name: 'Finance & Accounting',
    routes: ['/dashboard/finance']
  },
  
  // Employee Module
  employees: {
    permissions: ['employees.view', 'employees.manage'],
    name: 'Employee Management',
    routes: ['/dashboard/employees']
  },
  
  // Department Module
  departments: {
    permissions: ['departments.view', 'departments.manage'],
    name: 'Department Management',
    routes: ['/dashboard/departments']
  },
  
  // Project Module
  projects: {
    permissions: ['projects.view', 'projects.manage'],
    name: 'Project Management',
    routes: ['/dashboard/projects']
  },
  
  // Task Module
  tasks: {
    permissions: ['tasks.view', 'tasks.manage'],
    name: 'Task Management',
    routes: ['/dashboard/tasks']
  },
  
  // Resource Module
  resources: {
    permissions: ['resources.view', 'resources.manage'],
    name: 'Resource Planning',
    routes: ['/dashboard/resources']
  },
  
  // Budget Module
  budgets: {
    permissions: ['budgets.view', 'budgets.manage'],
    name: 'Budget Management',
    routes: ['/dashboard/budgets']
  },
  
  // Reports Module
  reports: {
    permissions: ['reports.view', 'reports.manage'],
    name: 'Reports & Analytics',
    routes: ['/dashboard/reports']
  },
  
  // Admin Module
  admin: {
    permissions: ['admin.view', 'system.manage'],
    name: 'Admin Panel',
    routes: ['/dashboard/admin'],
    requireAdmin: true
  },
  
  // User Management
  users: {
    permissions: ['users.view', 'users.manage'],
    name: 'User Management',
    routes: ['/dashboard/users'],
    requireAdmin: true
  },
  
  // Settings (accessible to all)
  settings: {
    permissions: [],
    name: 'Settings',
    routes: ['/dashboard/settings'],
    public: true
  },
  
  // Dashboard (accessible to all)
  dashboard: {
    permissions: [],
    name: 'Dashboard',
    routes: ['/dashboard'],
    public: true
  },
  
  // Contacts (accessible to all)
  contacts: {
    permissions: [],
    name: 'Contacts',
    routes: ['/dashboard/contacts'],
    public: true
  },
  
  // Chat (accessible to all)
  chat: {
    permissions: [],
    name: 'Chat',
    routes: ['/dashboard/chat'],
    public: true
  },
  
  // Activity (accessible to all)
  activity: {
    permissions: [],
    name: 'Activity Feed',
    routes: ['/dashboard/activity'],
    public: true
  }
} as const;

export type ModuleName = keyof typeof MODULE_PERMISSIONS;
