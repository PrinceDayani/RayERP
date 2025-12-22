// Permission-based access control system

export interface Role {
  _id: string;
  name: string;
  permissions: string[];
  level: number;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: Role | string;
}

// Permission constants - Standardized format (module.action)
export const PERMISSIONS = {
  // Dashboard & Analytics
  VIEW_DASHBOARD: 'dashboard.view',
  VIEW_ANALYTICS: 'analytics.view',
  ANALYTICS_FINANCIAL: 'analytics.financial',
  ANALYTICS_SALES: 'analytics.sales',
  ANALYTICS_INVENTORY: 'analytics.inventory',
  
  // Admin & System
  VIEW_ADMIN: 'admin.view',
  VIEW_SYSTEM: 'system.view',
  MANAGE_SYSTEM: 'system.manage',
  
  // User Management
  VIEW_USERS: 'users.view',
  CREATE_USER: 'users.create',
  EDIT_USER: 'users.edit',
  DELETE_USER: 'users.delete',
  MANAGE_USERS: 'users.manage',
  ASSIGN_ROLES: 'users.assign_roles',
  RESET_PASSWORD: 'users.reset_password',
  ACTIVATE_DEACTIVATE: 'users.activate_deactivate',
  
  // Role Management
  VIEW_ROLES: 'roles.view',
  CREATE_ROLE: 'roles.create',
  EDIT_ROLE: 'roles.edit',
  DELETE_ROLE: 'roles.delete',
  MANAGE_ROLES: 'roles.manage',
  
  // Employee Management
  VIEW_EMPLOYEES: 'employees.view',
  CREATE_EMPLOYEE: 'employees.create',
  EDIT_EMPLOYEE: 'employees.edit',
  DELETE_EMPLOYEE: 'employees.delete',
  VIEW_SALARY: 'employees.view_salary',
  EDIT_SALARY: 'employees.edit_salary',
  
  // Attendance
  VIEW_ATTENDANCE: 'attendance.view',
  MARK_ATTENDANCE: 'attendance.mark',
  EDIT_ATTENDANCE: 'attendance.edit',
  MANAGE_ATTENDANCE: 'attendance.manage',
  
  // Leaves
  VIEW_LEAVES: 'leaves.view',
  APPLY_LEAVE: 'leaves.apply',
  APPROVE_LEAVE: 'leaves.approve',
  CANCEL_LEAVE: 'leaves.cancel',
  CREATE_LEAVE: 'leaves.create',
  MANAGE_LEAVES: 'leaves.manage',
  
  // Projects (6)
  VIEW_PROJECTS: 'projects.view',
  CREATE_PROJECT: 'projects.create',
  EDIT_PROJECT: 'projects.edit',
  DELETE_PROJECT: 'projects.delete',
  ARCHIVE_PROJECT: 'projects.archive',
  MANAGE_PROJECT_TEAM: 'projects.manage_team',
  
  // Tasks (7)
  VIEW_TASKS: 'tasks.view',
  CREATE_TASK: 'tasks.create',
  EDIT_TASK: 'tasks.edit',
  DELETE_TASK: 'tasks.delete',
  ASSIGN_TASK: 'tasks.assign',
  CHANGE_TASK_STATUS: 'tasks.change_status',
  VIEW_ALL_TASKS: 'tasks.view_all',
  
  
  // Finance Module Access (Required for all finance operations)
  VIEW_FINANCE: 'finance.view',
  MANAGE_FINANCE: 'finance.manage',
  
  // Journal Entries (6)
  VIEW_JOURNAL: 'journal.view',
  CREATE_JOURNAL: 'journal.create',
  EDIT_JOURNAL: 'journal.edit',
  DELETE_JOURNAL: 'journal.delete',
  APPROVE_JOURNAL: 'journal.approve',
  POST_JOURNAL: 'journal.post',
  
  // Bills (4)
  VIEW_BILLS: 'bills.view',
  CREATE_BILL: 'bills.create',
  EDIT_BILL: 'bills.edit',
  DELETE_BILL: 'bills.delete',
  
  // Payments (5)
  VIEW_PAYMENTS: 'payments.view',
  CREATE_PAYMENT: 'payments.create',
  EDIT_PAYMENT: 'payments.edit',
  DELETE_PAYMENT: 'payments.delete',
  APPROVE_PAYMENT: 'payments.approve',
  
  // Chart of Accounts (4)
  VIEW_ACCOUNTS: 'accounts.view',
  CREATE_ACCOUNT: 'accounts.create',
  EDIT_ACCOUNT: 'accounts.edit',
  DELETE_ACCOUNT: 'accounts.delete',
  
  // General Ledger (2)
  VIEW_LEDGER: 'ledger.view',
  EXPORT_LEDGER: 'ledger.export',
  
  // Invoicing & Billing
  VIEW_INVOICES: 'invoices.view',
  CREATE_INVOICE: 'invoices.create',
  EDIT_INVOICE: 'invoices.edit',
  DELETE_INVOICE: 'invoices.delete',
  SEND_INVOICE: 'invoices.send',
  APPROVE_INVOICE: 'invoices.approve',
  CANCEL_INVOICE: 'invoices.cancel',
  DOWNLOAD_INVOICE: 'invoices.download',
  
  // Expenses
  VIEW_EXPENSES: 'expenses.view',
  CREATE_EXPENSE: 'expenses.create',
  EDIT_EXPENSE: 'expenses.edit',
  DELETE_EXPENSE: 'expenses.delete',
  APPROVE_EXPENSE: 'expenses.approve',
  
  // Budget & Planning
  VIEW_BUDGETS: 'budgets.view',
  CREATE_BUDGET: 'budgets.create',
  EDIT_BUDGET: 'budgets.edit',
  DELETE_BUDGET: 'budgets.delete',
  APPROVE_BUDGET: 'budgets.approve',
  ALLOCATE_BUDGET: 'budgets.allocate',
  TRACK_BUDGET: 'budgets.track',
  
  // Reports & Analytics
  VIEW_REPORTS: 'reports.view',
  CREATE_REPORTS: 'reports.create',
  EXPORT_REPORTS: 'reports.export',
  SCHEDULE_REPORTS: 'reports.schedule',
  
  // System Administration (All Active)
  MANAGE_PERMISSIONS: 'permissions.manage',
  VIEW_SETTINGS: 'settings.view',
  EDIT_SETTINGS: 'settings.edit',
  VIEW_LOGS: 'logs.view',
  EXPORT_LOGS: 'logs.export',
  VIEW_AUDIT: 'audit.view',
  VIEW_BACKUPS: 'backups.view',
  CREATE_BACKUP: 'backups.create',
  RESTORE_BACKUP: 'backups.restore',
  MANAGE_BACKUPS: 'backups.manage',
  MANAGE_NOTIFICATIONS: 'notifications.manage',
  EXPORT_DATA: 'data.export',
} as const;

// Role level thresholds
export const ROLE_LEVELS = {
  ROOT: 100,
  SUPER_ADMIN: 90,
  ADMIN: 80,
  MANAGER: 70,
  EMPLOYEE: 60,
  NORMAL: 50,
} as const;

/**
 * Check if user is Root (has all permissions)
 */
export const isRootUser = (user: User | null): boolean => {
  if (!user || !user.role) return false;
  const role = typeof user.role === 'string' ? user.role : user.role?.name || '';
  return role.toLowerCase() === 'root';
};

/**
 * Check if user has a specific permission (Root bypasses)
 */
export const hasPermission = (user: User | null, permission: string): boolean => {
  if (!user || !user.role) return false;
  if (isRootUser(user)) return true; // Root has all permissions
  
  const role = typeof user.role === 'string' ? null : user.role;
  if (!role) return false;
  
  return role.permissions?.includes(permission) || false;
};

/**
 * Check if user has any of the specified permissions
 */
export const hasAnyPermission = (user: User | null, permissions: string[]): boolean => {
  return permissions.some(permission => hasPermission(user, permission));
};

/**
 * Check if user has all of the specified permissions
 */
export const hasAllPermissions = (user: User | null, permissions: string[]): boolean => {
  return permissions.every(permission => hasPermission(user, permission));
};

/**
 * Check if user has minimum role level
 */
export const hasMinimumLevel = (user: User | null, minLevel: number): boolean => {
  if (!user || !user.role) return false;
  
  const role = typeof user.role === 'string' ? null : user.role;
  if (!role) return false;
  
  return role.level >= minLevel;
};

/**
 * Get user's role level
 */
export const getUserLevel = (user: User | null): number => {
  if (!user || !user.role) return 0;
  
  const role = typeof user.role === 'string' ? null : user.role;
  return role?.level || 0;
};

/**
 * Get user's permissions
 */
export const getUserPermissions = (user: User | null): string[] => {
  if (!user || !user.role) return [];
  
  const role = typeof user.role === 'string' ? null : user.role;
  return role?.permissions || [];
};

/**
 * Check if user has finance module access (Root bypasses)
 */
export const hasFinanceAccess = (user: User | null): boolean => {
  if (isRootUser(user)) return true;
  return hasAnyPermission(user, ['finance.view', 'finance.manage']);
};
