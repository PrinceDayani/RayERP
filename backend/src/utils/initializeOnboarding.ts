import { Role } from '../models/Role';
import { Permission } from '../models/Permission';
import { logger } from './logger';

export const initializeDefaultRoles = async () => {
  try {
    // Define default roles with their permissions
    // Permission names must match the catalog in rbacController.initializePermissions;
    // anything else is silently unmatchable by requirePermission. Levels are left at
    // the schema default deliberately - level >= 80 unlocks workflow administration
    // and project access on its own, so it is granted per role by hand, not here.
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
          'dashboard.view',
          'projects.view',
          'tasks.view',
          'tasks.change_status',
          'employees.view',
          'departments.view',
          'reports.view'
        ]
      },
      {
        name: 'Manager',
        description: 'Project and team management',
        permissions: [
          'dashboard.view',
          'projects.view',
          'projects.view_all',
          'projects.create',
          'projects.edit',
          'projects.manage_team',
          'projects.manage_phases',
          'tasks.view',
          'tasks.view_all',
          'tasks.create',
          'tasks.edit',
          'tasks.assign',
          'tasks.change_status',
          'employees.view',
          'departments.view',
          'departments.details',
          'departments.view_members',
          'users.view',
          'reports.view',
          'reports.create',
          'reports.export'
        ]
      },
      {
        name: 'Admin',
        description: 'Administrative access',
        permissions: [
          'dashboard.view',
          'admin.view',
          'users.view',
          'users.create',
          'users.edit',
          'users.delete',
          'users.assign_roles',
          'users.reset_password',
          'users.change_password',
          'users.activate_deactivate',
          'users.approve_status',
          'roles.view',
          'employees.view',
          'employees.create',
          'employees.edit',
          'employees.delete',
          'departments.view',
          'departments.details',
          'departments.create',
          'departments.edit',
          'departments.view_members',
          'departments.assign_members',
          'projects.view',
          'projects.view_all',
          'projects.create',
          'projects.edit',
          'projects.delete',
          'projects.manage_team',
          'projects.manage_phases',
          'tasks.view',
          'tasks.view_all',
          'tasks.create',
          'tasks.edit',
          'tasks.delete',
          'tasks.assign',
          'tasks.change_status',
          'reports.view',
          'reports.create',
          'reports.export',
          'activities.view',
          'audit.view',
          'data.export'
        ]
      },
      {
        name: 'Student',
        description: 'Limited access for students',
        permissions: [
          'dashboard.view',
          'projects.view',
          'tasks.view',
          'reports.view'
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