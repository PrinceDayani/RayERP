import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface Permission {
  resource: string;
  action: string;
  condition?: (context: any) => boolean;
}

const PERMISSIONS = {
  // User permissions
  'users.view': { resource: 'users', action: 'read' },
  'users.create': { resource: 'users', action: 'create' },
  'users.edit': { resource: 'users', action: 'update' },
  'users.delete': { resource: 'users', action: 'delete' },
  
  // Project permissions
  'projects.view': { resource: 'projects', action: 'read' },
  'projects.create': { resource: 'projects', action: 'create' },
  'projects.edit': { resource: 'projects', action: 'update' },
  'projects.delete': { resource: 'projects', action: 'delete' },
  'projects.assign': { resource: 'projects', action: 'assign' },
  
  // Task permissions
  'tasks.view': { resource: 'tasks', action: 'read' },
  'tasks.create': { resource: 'tasks', action: 'create' },
  'tasks.edit': { resource: 'tasks', action: 'update' },
  'tasks.delete': { resource: 'tasks', action: 'delete' },
  
  // Financial permissions
  'finance.view': { resource: 'finance', action: 'read' },
  'finance.edit': { resource: 'finance', action: 'update' },
  'finance.approve': { resource: 'finance', action: 'approve' },
  
  // Admin permissions
  'admin.access': { resource: 'admin', action: 'access' },
  'admin.settings': { resource: 'admin', action: 'settings' },
  'admin.logs': { resource: 'admin', action: 'logs' }
} as const;

type PermissionKey = keyof typeof PERMISSIONS;

export function usePermissions() {
  const { user } = useAuth();

  const permissions = useMemo(() => {
    if (!user) return new Set<string>();

    const userPermissions = new Set<string>();
    
    // Admin roles get all permissions
    if (['root', 'super_admin', 'admin'].includes(user.role?.toLowerCase() || '')) {
      Object.keys(PERMISSIONS).forEach(p => userPermissions.add(p));
      return userPermissions;
    }

    // Role-based permissions
    const rolePermissions: Record<string, string[]> = {
      manager: [
        'users.view', 'projects.view', 'projects.create', 'projects.edit', 
        'tasks.view', 'tasks.create', 'tasks.edit', 'finance.view'
      ],
      supervisor: [
        'projects.view', 'tasks.view', 'tasks.create', 'tasks.edit'
      ],
      employee: [
        'projects.view', 'tasks.view'
      ]
    };

    const role = user.role?.toLowerCase() || '';
    if (rolePermissions[role]) {
      rolePermissions[role].forEach(p => userPermissions.add(p));
    }

    // Add explicit user permissions
    if (user.permissions) {
      user.permissions.forEach((p: string) => userPermissions.add(p));
    }

    return userPermissions;
  }, [user]);

  const can = (permission: PermissionKey, context?: any): boolean => {
    if (!user) return false;
    
    if (!permissions.has(permission)) return false;

    const perm = PERMISSIONS[permission];
    if (perm.condition) {
      return perm.condition(context);
    }

    return true;
  };

  const canAny = (permissionList: PermissionKey[]): boolean => {
    return permissionList.some(p => can(p));
  };

  const canAll = (permissionList: PermissionKey[]): boolean => {
    return permissionList.every(p => can(p));
  };

  return {
    can,
    canAny,
    canAll,
    permissions: Array.from(permissions),
    isAdmin: ['root', 'super_admin', 'admin'].includes(user?.role?.toLowerCase() || '')
  };
}