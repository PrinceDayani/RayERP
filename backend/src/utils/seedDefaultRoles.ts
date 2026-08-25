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

export const NORMAL_ROLE_NAME = 'Normal';

/**
 * Baseline role assigned to the User account created alongside a new Employee.
 * Level 1 with no permissions, so it grants nothing until an administrator
 * assigns a real role. Self-healing so employee creation does not depend on
 * SEED_ON_STARTUP having run against this database.
 */
export const ensureNormalRole = async () => {
  const existing = await Role.findOne({ name: NORMAL_ROLE_NAME });
  if (existing) return existing;

  await Role.create({
    name: NORMAL_ROLE_NAME,
    description: 'Standard employee with basic access - no permissions until a role is assigned',
    permissions: [],
    isDefault: false,
    isActive: true,
    level: 1
  });
  return await Role.findOne({ name: NORMAL_ROLE_NAME });
};
