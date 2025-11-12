export const ROLE_NAMES = {
  ROOT: 'Root',
  SUPERADMIN: 'Superadmin',
  ADMIN: 'Admin',
  MANAGER: 'Manager',
  EMPLOYEE: 'Employee',
  NORMAL: 'Normal'
} as const;

export const ROLE_LEVELS = {
  [ROLE_NAMES.ROOT]: 100,
  [ROLE_NAMES.SUPERADMIN]: 90,
  [ROLE_NAMES.ADMIN]: 80,
  [ROLE_NAMES.MANAGER]: 70,
  [ROLE_NAMES.EMPLOYEE]: 60,
  [ROLE_NAMES.NORMAL]: 50
} as const;

export type RoleName = typeof ROLE_NAMES[keyof typeof ROLE_NAMES];

export const normalizeRoleName = (role: string): string => {
  const normalized = role.toLowerCase().replace(/[_\s]/g, '');
  
  switch (normalized) {
    case 'root': return ROLE_NAMES.ROOT;
    case 'superadmin': return ROLE_NAMES.SUPERADMIN;
    case 'admin': return ROLE_NAMES.ADMIN;
    case 'manager': return ROLE_NAMES.MANAGER;
    case 'employee': return ROLE_NAMES.EMPLOYEE;
    case 'normal': return ROLE_NAMES.NORMAL;
    default: return role;
  }
};
