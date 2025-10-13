import { Role } from '../models/Role';

export const initializeDefaultRoles = async () => {
  const defaultRoles = [
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
        'manage_roles', 'system_settings', 'view_logs'
      ]
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
        'view_reports', 'export_data'
      ]
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
      ]
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
      ]
    }
  ];

  try {
    for (const roleData of defaultRoles) {
      const existing = await Role.findOne({ name: roleData.name });
      if (!existing) {
        await Role.create(roleData);
        console.log(`✅ Created default role: ${roleData.name}`);
      }
    }
    console.log('✅ Default roles initialized');
  } catch (error) {
    console.error('❌ Error initializing default roles:', error);
  }
};