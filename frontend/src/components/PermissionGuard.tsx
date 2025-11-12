import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { hasPermission, hasMinimumLevel, hasAnyPermission, hasAllPermissions } from '@/lib/permissions';

interface PermissionGuardProps {
  children: ReactNode;
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
  minLevel?: number;
  fallback?: ReactNode;
}

export const PermissionGuard = ({
  children,
  permission,
  permissions,
  requireAll = false,
  minLevel,
  fallback = null,
}: PermissionGuardProps) => {
  const { user } = useAuth();

  let hasAccess = false;

  if (minLevel !== undefined) {
    hasAccess = hasMinimumLevel(user, minLevel);
  } else if (permission) {
    hasAccess = hasPermission(user, permission);
  } else if (permissions) {
    hasAccess = requireAll
      ? hasAllPermissions(user, permissions)
      : hasAnyPermission(user, permissions);
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>;
};
