import { Role } from '../models/Role';

export const seedDefaultRoles = async () => {
  // Only Root role exists - Root is almighty
};

export const ensureRootRole = async () => {
  const rootRole = await Role.findOne({ name: 'Root' });
  if (!rootRole) {
    await Role.create({
      name: 'Root',
      description: 'Almighty system owner with complete access - Only Root exists',
      permissions: ['*'],
      isDefault: true,
      isActive: true,
      level: 100
    });
  }
  return await Role.findOne({ name: 'Root' });
};

export const PENDING_ROLE_NAME = 'Pending';

/**
 * Role held by self-registered users until an Admin/Root approves them.
 * Level 0 with no permissions, so authorizeMinLevel and requirePermission both
 * deny it independently of the account's pending_approval status.
 */
export const ensurePendingRole = async () => {
  const existing = await Role.findOne({ name: PENDING_ROLE_NAME });
  if (existing) return existing;

  await Role.create({
    name: PENDING_ROLE_NAME,
    description: 'Awaiting administrator approval - no access until a role is assigned',
    permissions: [],
    isDefault: false,
    isActive: true,
    level: 0
  });
  return await Role.findOne({ name: PENDING_ROLE_NAME });
};
