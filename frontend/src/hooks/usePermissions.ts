import { useAuth } from '@/contexts/AuthContext';
import { 
  hasPermission, 
  hasAnyPermission, 
  hasAllPermissions, 
  hasMinimumLevel,
  getUserLevel,
  getUserPermissions
} from '@/lib/permissions';

export const usePermissions = () => {
  const { user } = useAuth();

  return {
    hasPermission: (permission: string) => hasPermission(user, permission),
    hasAnyPermission: (permissions: string[]) => hasAnyPermission(user, permissions),
    hasAllPermissions: (permissions: string[]) => hasAllPermissions(user, permissions),
    hasMinimumLevel: (minLevel: number) => hasMinimumLevel(user, minLevel),
    userLevel: getUserLevel(user),
    userPermissions: getUserPermissions(user),
  };
};
