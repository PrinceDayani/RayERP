import { Role } from '../models/Role';

export const initializeDefaultRoles = async () => {
  const defaultRoles = [
    {
      name: 'Root',
      description: 'Root user with all permissions - cannot be modified',
      permissions: ['*'],
      isDefault: true,
      level: 100
    },
    {
      name: 'Super Admin',
      description: 'Full system access with all permissions',
      permissions: [
        'view_users', 'create_user', 'update_user', 'delete_user',
        'view_products', 'create_product', 'update_product', 'delete_product',
        'view_orders', 'create_order', 'update_order', 'delete_order',
        'view_inventory', 'manage_inventory',
        'view_customers', 'create_customer', 'update_customer', 'delete_customer',
        'view_reports', 'export_data',
        'manage_roles', 'system_settings', 'view_logs',
        'roles.view', 'roles.create', 'roles.edit', 'roles.delete',
        'permissions.view', 'permissions.create', 'permissions.edit', 'permissions.delete',
        'users.view', 'users.create', 'users.edit', 'users.delete', 'users.assign_roles'
      ],
      isDefault: true,
      level: 90
    },
    {
      name: 'Manager',
      description: 'Management level access with most permissions',
      permissions: [
        'view_users', 'create_user', 'update_user',
        'view_products', 'create_product', 'update_product',
        'view_orders', 'create_order', 'update_order',
        'view_inventory', 'manage_inventory',
        'view_customers', 'create_customer', 'update_customer',
        'view_reports', 'export_data',
        'users.view', 'users.edit'
      ],
      isDefault: true,
      level: 50
    },
    {
      name: 'Employee',
      description: 'Standard employee access for daily operations',
      permissions: [
        'view_products', 'update_product',
        'view_orders', 'create_order', 'update_order',
        'view_inventory',
        'view_customers', 'create_customer', 'update_customer',
        'view_reports'
      ],
      isDefault: true,
      level: 30
    },
    {
      name: 'Viewer',
      description: 'Read-only access to view data',
      permissions: [
        'view_products',
        'view_orders',
        'view_inventory',
        'view_customers',
        'view_reports'
      ],
      isDefault: true,
      level: 10
    }
  ];

  try {
    for (const roleData of defaultRoles) {
      const existing = await Role.findOne({ name: roleData.name });
      if (!existing) {
        await Role.create(roleData);
        console.log(`✅ Created default role: ${roleData.name}`);
      } else if (roleData.name === 'Root') {
        // Ensure Root always has all permissions
        existing.permissions = ['*'];
        existing.level = 100;
        existing.isDefault = true;
        await existing.save();
        console.log(`✅ Updated Root role with all permissions`);
      }
    }
    console.log('✅ Default roles initialized');
  } catch (error) {
    console.error('❌ Error initializing default roles:', error);
  }
};