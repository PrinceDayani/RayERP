import { usePermissions } from "@/hooks/usePermissions";
import { PERMISSIONS } from "@/lib/permissions";

// Everyone can read organisation settings; only this permission may change them.
export function useCanManageOrganization(): boolean {
  const { hasPermission, isRoot } = usePermissions();
  return isRoot || hasPermission(PERMISSIONS.MANAGE_ORGANIZATION);
}
