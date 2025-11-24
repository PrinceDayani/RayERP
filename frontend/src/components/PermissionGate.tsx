"use client";

import React from 'react';
import { usePermissions } from '@/hooks/usePermissions';

interface PermissionGateProps {
  children: React.ReactNode;
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
  role?: string;
}

export function PermissionGate({
  children,
  permission,
  permissions = [],
  requireAll = false,
  fallback = null,
  role
}: PermissionGateProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();
  const isAdmin = false; // Placeholder for admin check

  // Role-based access
  if (role && role === 'admin' && !isAdmin) {
    return <>{fallback}</>;
  }

  // Single permission check
  if (permission && !hasPermission(permission)) {
    return <>{fallback}</>;
  }

  // Multiple permissions check
  if (permissions.length > 0) {
    const hasAccess = requireAll 
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);
    
    if (!hasAccess) {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
}
