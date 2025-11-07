import { Role } from '../models/Role';

export const seedDefaultRoles = async () => {
  const defaultRoles = [
    {
      name: 'Superadmin',
      description: 'Director/CEO with extended administrative access - Permissions must be granted by Root',
      permissions: [],
      isDefault: true,
      isActive: true,
      level: 90
    },
    {
      name: 'Admin',
      description: 'Manager with administrative access - Permissions must be granted by Root',
      permissions: [],
      isDefault: true,
      isActive: true,
      level: 80
    }
  ];

  for (const roleData of defaultRoles) {
    const existing = await Role.findOne({ name: roleData.name });
    if (!existing) {
      await Role.create(roleData);
      console.log(`✓ Created default role: ${roleData.name} (no permissions - must be granted by Root)`);
    }
  }
};

export const ensureRootRole = async () => {
  const rootRole = await Role.findOne({ name: 'Root' });
  if (!rootRole) {
    await Role.create({
      name: 'Root',
      description: 'System owner with full access - Only one Root user allowed',
      permissions: ['*'],
      isDefault: true,
      isActive: true,
      level: 100
    });
    console.log('✓ Created Root role');
  }
  return await Role.findOne({ name: 'Root' });
};
