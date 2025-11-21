"use client";

import React from 'react';
import { useUserAssignments } from '@/hooks/useUserAssignments';
import { useAuth } from '@/contexts/AuthContext';

interface AssignmentGuardProps {
  children: React.ReactNode;
  resourceType: 'project' | 'task' | 'budget' | 'report' | 'document';
  resourceId: string;
  requiredPermission?: string;
  fallback?: React.ReactNode;
}

export function AssignmentGuard({
  children,
  resourceType,
  resourceId,
  requiredPermission,
  fallback = null
}: AssignmentGuardProps) {
  const { user } = useAuth();
  const { hasAccess, getPermissions, loading } = useUserAssignments();

  if (loading) {
    return <div className="animate-pulse h-4 bg-gray-200 rounded"></div>;
  }

  if (!user) {
    return fallback;
  }

  // Admin users see everything
  if (['admin', 'super_admin', 'root'].includes(user.role ? String(user.role).toLowerCase() : '')) {
    return <>{children}</>;
  }

  // Check if user has access to this resource
  if (!hasAccess(resourceType, resourceId)) {
    return fallback;
  }

  // Check specific permission if required
  if (requiredPermission) {
    const permissions = getPermissions(resourceType, resourceId);
    if (!permissions.includes(requiredPermission)) {
      return fallback;
    }
  }

  return <>{children}</>;
}