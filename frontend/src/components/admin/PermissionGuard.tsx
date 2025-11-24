"use client";

import React from 'react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock, Shield, AlertTriangle } from "lucide-react";
import { useAdminPermissions, AdminPermissions } from '@/hooks/useAdminPermissions';

interface PermissionGuardProps {
  children: React.ReactNode;
  permission?: keyof AdminPermissions;
  permissions?: (keyof AdminPermissions)[];
  requireAll?: boolean;
  minimumLevel?: 'read' | 'write' | 'admin' | 'super_admin';
  fallback?: React.ReactNode;
  showError?: boolean;
  errorMessage?: string;
}

export function PermissionGuard({
  children,
  permission,
  permissions = [],
  requireAll = false,
  minimumLevel,
  fallback,
  showError = true,
  errorMessage
}: PermissionGuardProps) {
  const {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasMinimumLevel,
    isLoading,
    permissionLevel
  } = useAdminPermissions();

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Check permissions
  let hasAccess = false;

  if (minimumLevel) {
    hasAccess = hasMinimumLevel(minimumLevel);
  } else if (permission) {
    hasAccess = hasPermission(permission);
  } else if (permissions.length > 0) {
    hasAccess = requireAll 
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);
  } else {
    // No specific permission required, allow access
    hasAccess = true;
  }

  // If user has access, render children
  if (hasAccess) {
    return <>{children}</>;
  }

  // If custom fallback is provided, use it
  if (fallback) {
    return <>{fallback}</>;
  }

  // If showError is false, render nothing
  if (!showError) {
    return null;
  }

  // Default error message based on permission level
  const getDefaultErrorMessage = () => {
    if (permissionLevel.level === 'none') {
      return "You need to be logged in to access this feature.";
    }
    
    if (minimumLevel) {
      return `This feature requires ${minimumLevel} level access or higher.`;
    }
    
    if (permission) {
      return `You don't have permission to access this feature. Required: ${permission}`;
    }
    
    if (permissions.length > 0) {
      const permissionText = requireAll ? 'all of these permissions' : 'one of these permissions';
      return `You don't have ${permissionText}: ${permissions.join(', ')}`;
    }
    
    return "You don't have permission to access this feature.";
  };

  const displayMessage = errorMessage || getDefaultErrorMessage();

  // Render appropriate error based on permission level
  if (permissionLevel.level === 'none') {
    return (
      <Alert className="border-amber-200 bg-amber-50">
        <Lock className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800">
          {displayMessage}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="border-red-200 bg-red-50">
      <Shield className="h-4 w-4 text-red-600" />
      <AlertDescription className="text-red-800">
        {displayMessage}
      </AlertDescription>
    </Alert>
  );
}

// Convenience components for common permission checks
export function AdminOnly({ children, fallback, showError = true }: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showError?: boolean;
}) {
  return (
    <PermissionGuard
      minimumLevel="admin"
      fallback={fallback}
      showError={showError}
    >
      {children}
    </PermissionGuard>
  );
}

export function SuperAdminOnly({ children, fallback, showError = true }: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showError?: boolean;
}) {
  return (
    <PermissionGuard
      minimumLevel="super_admin"
      fallback={fallback}
      showError={showError}
    >
      {children}
    </PermissionGuard>
  );
}

export function UserManagementGuard({ children, action = 'view' }: {
  children: React.ReactNode;
  action?: 'view' | 'create' | 'edit' | 'delete' | 'manage';
}) {
  const permissionMap = {
    view: 'canViewUsers' as keyof AdminPermissions,
    create: 'canCreateUsers' as keyof AdminPermissions,
    edit: 'canEditUsers' as keyof AdminPermissions,
    delete: 'canDeleteUsers' as keyof AdminPermissions,
    manage: 'canManageRoles' as keyof AdminPermissions,
  };

  return (
    <PermissionGuard permission={permissionMap[action]}>
      {children}
    </PermissionGuard>
  );
}

export function SystemManagementGuard({ children, action = 'view' }: {
  children: React.ReactNode;
  action?: 'view' | 'manage' | 'logs' | 'backup';
}) {
  const permissionMap = {
    view: 'canViewSystemMetrics' as keyof AdminPermissions,
    manage: 'canManageSystem' as keyof AdminPermissions,
    logs: 'canViewLogs' as keyof AdminPermissions,
    backup: 'canManageBackups' as keyof AdminPermissions,
  };

  return (
    <PermissionGuard permission={permissionMap[action]}>
      {children}
    </PermissionGuard>
  );
}

export function FinancialGuard({ children, action = 'view' }: {
  children: React.ReactNode;
  action?: 'view' | 'manage' | 'approve';
}) {
  const permissionMap = {
    view: 'canViewFinancialData' as keyof AdminPermissions,
    manage: 'canManageFinancialSettings' as keyof AdminPermissions,
    approve: 'canApproveTransactions' as keyof AdminPermissions,
  };

  return (
    <PermissionGuard permission={permissionMap[action]}>
      {children}
    </PermissionGuard>
  );
}

export function ProjectGuard({ children, action = 'view' }: {
  children: React.ReactNode;
  action?: 'view' | 'manage' | 'override';
}) {
  const permissionMap = {
    view: 'canViewAllProjects' as keyof AdminPermissions,
    manage: 'canManageProjectSettings' as keyof AdminPermissions,
    override: 'canOverrideProjectAccess' as keyof AdminPermissions,
  };

  return (
    <PermissionGuard permission={permissionMap[action]}>
      {children}
    </PermissionGuard>
  );
}

export function ReportsGuard({ children, action = 'view' }: {
  children: React.ReactNode;
  action?: 'view' | 'create' | 'schedule';
}) {
  const permissionMap = {
    view: 'canViewReports' as keyof AdminPermissions,
    create: 'canCreateReports' as keyof AdminPermissions,
    schedule: 'canScheduleReports' as keyof AdminPermissions,
  };

  return (
    <PermissionGuard permission={permissionMap[action]}>
      {children}
    </PermissionGuard>
  );
}

export function SettingsGuard({ children, action = 'view' }: {
  children: React.ReactNode;
  action?: 'view' | 'manage' | 'integrations';
}) {
  const permissionMap = {
    view: 'canViewSettings' as keyof AdminPermissions,
    manage: 'canManageSettings' as keyof AdminPermissions,
    integrations: 'canManageIntegrations' as keyof AdminPermissions,
  };

  return (
    <PermissionGuard permission={permissionMap[action]}>
      {children}
    </PermissionGuard>
  );
}
