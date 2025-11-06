import { Role } from '../models/Role';
import { Permission } from '../models/Permission';

export const initializeDefaultRoles = async () => {
  try {
    // Define default roles with their permissions
    const defaultRoles = [
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
        console.log(`Created default role: ${roleData.name}`);
      }
    }

    console.log('Default roles initialization completed');
  } catch (error) {
    console.error('Error initializing default roles:', error);
  }
};

export const initializeOnboardingSystem = async () => {
  console.log('Initializing onboarding system...');
  
  // Initialize permissions first (from rbacController)
  const { initializePermissions } = await import('../controllers/rbacController');
  await initializePermissions();
  
  // Then initialize default roles
  await initializeDefaultRoles();
  
  console.log('Onboarding system initialization completed');
};