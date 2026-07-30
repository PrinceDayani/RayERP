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
