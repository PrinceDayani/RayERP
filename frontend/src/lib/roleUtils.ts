// Role normalization utility to handle case-insensitive role comparisons

export const normalizeRole = (role: string | { name: string } | undefined | null): string => {
  if (!role) return '';
  const roleName = typeof role === 'string' ? role : role.name;
  return roleName.trim();
};

export const compareRoles = (role1: string | { name: string } | undefined | null, role2: string): boolean => {
  const normalized1 = normalizeRole(role1).toLowerCase();
  const normalized2 = role2.toLowerCase();
  return normalized1 === normalized2;
};

export const getRoleDisplayName = (role: string | { name: string } | undefined | null): string => {
  return normalizeRole(role) || 'N/A';
};
