import { Role } from '../models/Role';
import { Permission } from '../models/Permission';
import { logger } from './logger';

export const initializeDefaultRoles = async () => {
  try {
    // Define default roles with their permissions
    const defaultRoles = [
      {
        name: 'Normal',
        description: 'Standard employee with basic access',
        permissions: []
      },
      {
        name: 'Employee',
        description: 'Basic employee access',
        permissions: [
          'view_projects',
          'view_customers',
          'view_reports'
        ]
      },
      {
        name: 'Manager',
        description: 'Project and team management',
        permissions: [
          'view_projects',
          'create_project',
          'update_project',
          'view_customers',
          'create_customer',
          'update_customer',
          'view_reports',
          'view_users'
        ]
      },
      {
        name: 'Admin',
        description: 'Administrative access',
        permissions: [
          'view_users',
          'create_user',
          'update_user',
          'view_projects',
          'create_project',
          'update_project',
          'delete_project',
          'manage_projects',
          'view_customers',
          'create_customer',
          'update_customer',
          'delete_customer',
          'view_reports',
          'export_data',
          'manage_roles'
        ]
      },
      {
        name: 'Student',
        description: 'Limited access for students',
        permissions: [
          'view_projects',
          'view_reports'
        ]
      }
    ];

    // Create roles if they don't exist
    for (const roleData of defaultRoles) {
      const existingRole = await Role.findOne({ name: roleData.name });
      if (!existingRole) {
        await Role.create(roleData);
      }
    }
  } catch (error: any) {
    logger.error('Error initializing default roles', { message: error?.message });
  }
};

export const initializeOnboardingSystem = async () => {
  // Initialize permissions first (from rbacController)
  const { initializePermissions } = await import('../controllers/rbacController');
  await initializePermissions();

  // Then initialize default roles
  await initializeDefaultRoles();
};