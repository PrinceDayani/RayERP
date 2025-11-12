"use client";

import React, { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, UserRole } from '@/contexts/AuthContext';

interface RoleGuardProps {
  children: ReactNode;
  requiredRoles?: UserRole[];
  minimumRole?: UserRole;
  redirectTo?: string;
}

const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  requiredRoles,
  minimumRole,
  redirectTo = '/login',
}) => {
  const { isAuthenticated, loading, hasMinimumLevel, user } = useAuth();
  
  const hasPermission = (roles: UserRole[]): boolean => {
    if (!user || !user.role) return false;
    
    const userRole = typeof user.role === 'string' ? user.role : user.role?.name || '';
    const userRoleName = userRole.toLowerCase().trim();
    
    if (userRoleName === 'root') return true;
    
    return roles.some(role => {
      const roleName = typeof role === 'string' ? role : role.toString();
      return userRoleName === roleName.toLowerCase().trim();
    });
  };
  
  const hasMinimumRole = (role: UserRole) => {
    return hasMinimumLevel ? hasMinimumLevel(getRoleLevel(role)) : false;
  };
  
  const getRoleLevel = (role: UserRole): number => {
    const levels: Record<UserRole, number> = {
      [UserRole.ROOT]: 100,
      [UserRole.SUPER_ADMIN]: 90,
      [UserRole.ADMIN]: 80,
      [UserRole.MANAGER]: 70,
      [UserRole.EMPLOYEE]: 60,
      [UserRole.NORMAL]: 50
    };
    return levels[role] || 0;
  };
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        // Not authenticated, redirect to login
        router.push(redirectTo);
      } else if (requiredRoles && !hasPermission(requiredRoles)) {
        // Authenticated but doesn't have the required roles
        router.push('/dashboard');
      } else if (minimumRole && !hasMinimumRole(minimumRole)) {
        // Authenticated but doesn't have the minimum required role
        router.push('/dashboard');
      }
    }
  }, [isAuthenticated, loading, requiredRoles, minimumRole, router, redirectTo]);

  // Show nothing while checking authentication or during redirection
  if (loading || !isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Check role permissions if roles are specified
  if (requiredRoles && !hasPermission(requiredRoles)) {
    return null;
  }

  // Check minimum role if specified
  if (minimumRole && !hasMinimumRole(minimumRole)) {
    return null;
  }

  // Render children if authenticated and has required permissions
  return <>{children}</>;
};

export default RoleGuard;