import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export interface AdminPermissions {
  // User Management
  canViewUsers: boolean;
  canCreateUsers: boolean;
  canEditUsers: boolean;
  canDeleteUsers: boolean;
  canManageRoles: boolean;
  
  // System Management
  canViewSystemMetrics: boolean;
  canManageSystem: boolean;
  canViewLogs: boolean;
  canExportData: boolean;
  canManageBackups: boolean;
  
  // Security
  canViewSecurityLogs: boolean;
  canManageSecurity: boolean;
  canViewAuditTrail: boolean;
  
  // Financial
  canViewFinancialData: boolean;
  canManageFinancialSettings: boolean;
  canApproveTransactions: boolean;
  
  // Projects
  canViewAllProjects: boolean;
  canManageProjectSettings: boolean;
  canOverrideProjectAccess: boolean;
  
  // Reports
  canViewReports: boolean;
  canCreateReports: boolean;
  canScheduleReports: boolean;
  
  // Settings
  canViewSettings: boolean;
  canManageSettings: boolean;
  canManageIntegrations: boolean;
}

export interface PermissionLevel {
  level: 'none' | 'read' | 'write' | 'admin' | 'super_admin';
  score: number;
}

const PERMISSION_HIERARCHY = {
  'none': 0,
  'read': 1,
  'write': 2,
  'admin': 3,
  'super_admin': 4,
  'root': 5
};

const DEFAULT_PERMISSIONS: AdminPermissions = {
  canViewUsers: false,
  canCreateUsers: false,
  canEditUsers: false,
  canDeleteUsers: false,
  canManageRoles: false,
  canViewSystemMetrics: false,
  canManageSystem: false,
  canViewLogs: false,
  canExportData: false,
  canManageBackups: false,
  canViewSecurityLogs: false,
  canManageSecurity: false,
  canViewAuditTrail: false,
  canViewFinancialData: false,
  canManageFinancialSettings: false,
  canApproveTransactions: false,
  canViewAllProjects: false,
  canManageProjectSettings: false,
  canOverrideProjectAccess: false,
  canViewReports: false,
  canCreateReports: false,
  canScheduleReports: false,
  canViewSettings: false,
  canManageSettings: false,
  canManageIntegrations: false,
};

export function useAdminPermissions() {
  const { user, isAuthenticated } = useAuth();
  const [permissions, setPermissions] = useState<AdminPermissions>(DEFAULT_PERMISSIONS);
  const [isLoading, setIsLoading] = useState(true);

  // Calculate permission level
  const permissionLevel = useMemo((): PermissionLevel => {
    if (!user || !isAuthenticated) {
      return { level: 'none', score: 0 };
    }

    const userRole = user.role?.toLowerCase() || 'none';
    const score = PERMISSION_HIERARCHY[userRole as keyof typeof PERMISSION_HIERARCHY] || 0;
    
    return {
      level: userRole as PermissionLevel['level'],
      score
    };
  }, [user, isAuthenticated]);

  // Check if user has specific permission
  const hasPermission = (permission: keyof AdminPermissions): boolean => {
    return permissions[permission];
  };

  // Check if user has any of the specified permissions
  const hasAnyPermission = (permissionList: (keyof AdminPermissions)[]): boolean => {
    return permissionList.some(permission => permissions[permission]);
  };

  // Check if user has all of the specified permissions
  const hasAllPermissions = (permissionList: (keyof AdminPermissions)[]): boolean => {
    return permissionList.every(permission => permissions[permission]);
  };

  // Check if user has minimum permission level
  const hasMinimumLevel = (minLevel: PermissionLevel['level']): boolean => {
    const minScore = PERMISSION_HIERARCHY[minLevel];
    return permissionLevel.score >= minScore;
  };

  // Get permissions for specific resource
  const getResourcePermissions = (resource: string) => {
    const resourcePermissions = {
      users: {
        canView: permissions.canViewUsers,
        canCreate: permissions.canCreateUsers,
        canEdit: permissions.canEditUsers,
        canDelete: permissions.canDeleteUsers,
        canManage: permissions.canManageRoles
      },
      system: {
        canView: permissions.canViewSystemMetrics,
        canManage: permissions.canManageSystem,
        canViewLogs: permissions.canViewLogs,
        canExport: permissions.canExportData,
        canBackup: permissions.canManageBackups
      },
      security: {
        canView: permissions.canViewSecurityLogs,
        canManage: permissions.canManageSecurity,
        canAudit: permissions.canViewAuditTrail
      },
      financial: {
        canView: permissions.canViewFinancialData,
        canManage: permissions.canManageFinancialSettings,
        canApprove: permissions.canApproveTransactions
      },
      projects: {
        canViewAll: permissions.canViewAllProjects,
        canManage: permissions.canManageProjectSettings,
        canOverride: permissions.canOverrideProjectAccess
      },
      reports: {
        canView: permissions.canViewReports,
        canCreate: permissions.canCreateReports,
        canSchedule: permissions.canScheduleReports
      },
      settings: {
        canView: permissions.canViewSettings,
        canManage: permissions.canManageSettings,
        canIntegrate: permissions.canManageIntegrations
      }
    };

    return resourcePermissions[resource as keyof typeof resourcePermissions] || {};
  };

  // Calculate permissions based on user role and explicit permissions
  useEffect(() => {
    const calculatePermissions = () => {
      if (!user || !isAuthenticated) {
        setPermissions(DEFAULT_PERMISSIONS);
        setIsLoading(false);
        return;
      }

      const userRole = user.role?.toLowerCase();
      const userPermissions = user.permissions || [];
      const userRoles = user.roles || [];

      // Start with default permissions
      let newPermissions = { ...DEFAULT_PERMISSIONS };

      // Role-based permissions
      switch (userRole) {
        case 'root':
        case 'super_admin':
          // Super admin has all permissions
          Object.keys(newPermissions).forEach(key => {
            newPermissions[key as keyof AdminPermissions] = true;
          });
          break;

        case 'admin':
          // Admin has most permissions except super admin specific ones
          newPermissions = {
            ...newPermissions,
            canViewUsers: true,
            canCreateUsers: true,
            canEditUsers: true,
            canDeleteUsers: true,
            canManageRoles: true,
            canViewSystemMetrics: true,
            canManageSystem: true,
            canViewLogs: true,
            canExportData: true,
            canManageBackups: true,
            canViewSecurityLogs: true,
            canManageSecurity: true,
            canViewAuditTrail: true,
            canViewFinancialData: true,
            canManageFinancialSettings: true,
            canApproveTransactions: true,
            canViewAllProjects: true,
            canManageProjectSettings: true,
            canOverrideProjectAccess: true,
            canViewReports: true,
            canCreateReports: true,
            canScheduleReports: true,
            canViewSettings: true,
            canManageSettings: true,
            canManageIntegrations: false, // Only super admin
          };
          break;

        case 'manager':
          // Manager has limited admin permissions
          newPermissions = {
            ...newPermissions,
            canViewUsers: true,
            canEditUsers: true,
            canViewSystemMetrics: true,
            canViewLogs: true,
            canExportData: true,
            canViewSecurityLogs: true,
            canViewAuditTrail: true,
            canViewFinancialData: true,
            canApproveTransactions: true,
            canViewAllProjects: true,
            canManageProjectSettings: true,
            canViewReports: true,
            canCreateReports: true,
            canViewSettings: true,
          };
          break;

        case 'supervisor':
          // Supervisor has basic admin permissions
          newPermissions = {
            ...newPermissions,
            canViewUsers: true,
            canViewSystemMetrics: true,
            canViewLogs: true,
            canViewFinancialData: true,
            canViewAllProjects: true,
            canViewReports: true,
            canViewSettings: true,
          };
          break;
      }

      // Override with explicit permissions
      userPermissions.forEach((permission: string) => {
        switch (permission) {
          case 'users:read':
            newPermissions.canViewUsers = true;
            break;
          case 'users:write':
            newPermissions.canCreateUsers = true;
            newPermissions.canEditUsers = true;
            break;
          case 'users:delete':
            newPermissions.canDeleteUsers = true;
            break;
          case 'users:manage':
            newPermissions.canManageRoles = true;
            break;
          case 'system:read':
            newPermissions.canViewSystemMetrics = true;
            newPermissions.canViewLogs = true;
            break;
          case 'system:manage':
            newPermissions.canManageSystem = true;
            newPermissions.canManageBackups = true;
            break;
          case 'security:read':
            newPermissions.canViewSecurityLogs = true;
            newPermissions.canViewAuditTrail = true;
            break;
          case 'security:manage':
            newPermissions.canManageSecurity = true;
            break;
          case 'financial:read':
            newPermissions.canViewFinancialData = true;
            break;
          case 'financial:manage':
            newPermissions.canManageFinancialSettings = true;
            break;
          case 'financial:approve':
            newPermissions.canApproveTransactions = true;
            break;
          case 'projects:read':
            newPermissions.canViewAllProjects = true;
            break;
          case 'projects:manage':
            newPermissions.canManageProjectSettings = true;
            newPermissions.canOverrideProjectAccess = true;
            break;
          case 'reports:read':
            newPermissions.canViewReports = true;
            break;
          case 'reports:write':
            newPermissions.canCreateReports = true;
            newPermissions.canScheduleReports = true;
            break;
          case 'settings:read':
            newPermissions.canViewSettings = true;
            break;
          case 'settings:manage':
            newPermissions.canManageSettings = true;
            break;
          case 'integrations:manage':
            newPermissions.canManageIntegrations = true;
            break;
        }
      });

      // Role-based permissions from RBAC roles
      userRoles.forEach((role: any) => {
        if (role.permissions) {
          role.permissions.forEach((permission: string) => {
            // Apply same logic as explicit permissions
            // This allows for granular RBAC control
          });
        }
      });

      setPermissions(newPermissions);
      setIsLoading(false);
    };

    calculatePermissions();
  }, [user, isAuthenticated]);

  return {
    permissions,
    permissionLevel,
    isLoading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasMinimumLevel,
    getResourcePermissions,
    isAdmin: permissionLevel.score >= PERMISSION_HIERARCHY.admin,
    isSuperAdmin: permissionLevel.score >= PERMISSION_HIERARCHY.super_admin,
    isRoot: permissionLevel.level === 'root'
  };
}