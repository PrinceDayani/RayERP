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
  const { can, canAny, canAll, isAdmin } = usePermissions();

  // Role-based access
  if (role && role === 'admin' && !isAdmin) {
    return <>{fallback}</>;
  }

  // Single permission check
  if (permission && !can(permission as any)) {
    return <>{fallback}</>;
  }

  // Multiple permissions check
  if (permissions.length > 0) {
    const hasAccess = requireAll 
      ? canAll(permissions as any[])
      : canAny(permissions as any[]);
    
    if (!hasAccess) {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
}