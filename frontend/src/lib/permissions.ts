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

// Permission constants
export const PERMISSIONS = {
  // Dashboard
  VIEW_DASHBOARD: 'view:dashboard',
  VIEW_ANALYTICS: 'view:analytics',
  
  // Admin
  MANAGE_USERS: 'manage:users',
  MANAGE_ROLES: 'manage:roles',
  MANAGE_SYSTEM: 'manage:system',
  VIEW_ADMIN_PANEL: 'view:admin_panel',
  
  // Employees
  VIEW_EMPLOYEES: 'view:employees',
  CREATE_EMPLOYEE: 'create:employee',
  EDIT_EMPLOYEE: 'edit:employee',
  DELETE_EMPLOYEE: 'delete:employee',
  
  // Projects
  VIEW_PROJECTS: 'view:projects',
  CREATE_PROJECT: 'create:project',
  EDIT_PROJECT: 'edit:project',
  DELETE_PROJECT: 'delete:project',
  
  // Tasks
  VIEW_TASKS: 'view:tasks',
  CREATE_TASK: 'create:task',
  EDIT_TASK: 'edit:task',
  DELETE_TASK: 'delete:task',
  
  // Finance
  VIEW_FINANCE: 'view:finance',
  MANAGE_FINANCE: 'manage:finance',
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
 * Check if user has a specific permission
 */
export const hasPermission = (user: User | null, permission: string): boolean => {
  if (!user || !user.role) return false;
  
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
