import { Request, Response } from 'express';
import { Role } from '../models/Role';
import { Permission } from '../models/Permission';
import User from '../models/User';

// Roles Management
export const getRoles = async (req: Request, res: Response) => {
  try {
    const roles = await Role.find().sort({ level: -1 });
    res.json(roles);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching roles', error });
  }
};

export const createRole = async (req: Request, res: Response) => {
  try {
    const { name, description, permissions, level } = req.body;
    
    const currentUser = await User.findById(req.user?.id).populate('role');
    const currentUserRole = currentUser?.role as any;
    
    if (currentUserRole?.name?.toLowerCase() !== 'root') {
      return res.status(403).json({ 
        message: 'Only Root user can create roles' 
      });
    }
    
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Role name is required' });
    }
    
    if (name.toLowerCase().trim() === 'root') {
      return res.status(403).json({ 
        message: 'Cannot create Root role. Root is hardcoded and unique.' 
      });
    }
    
    const existingRole = await Role.findOne({ name });
    if (existingRole) {
      return res.status(400).json({ message: 'Role already exists' });
    }

    const rolePermissions = permissions || [];
    
    if (rolePermissions.length > 0) {
      const validPermissions = await Permission.find({ 
        name: { $in: rolePermissions },
        isActive: true 
      });
      
      const validPermissionNames = validPermissions.map(p => p.name);
      const invalidPermissions = rolePermissions.filter(
        (p: string) => !validPermissionNames.includes(p)
      );
      
      if (invalidPermissions.length > 0) {
        return res.status(400).json({ 
          message: 'Invalid permissions provided',
          invalidPermissions 
        });
      }
    }

    const role = new Role({ 
      name, 
      description, 
      permissions: rolePermissions, 
      level: level || 50,
      isDefault: false 
    });
    await role.save();
    
    res.status(201).json({ 
      ...role.toObject(),
      message: rolePermissions.length === 0 
        ? 'Role created successfully with no permissions. Grant permissions to make it functional.' 
        : 'Role created successfully with assigned permissions.'
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating role', error });
  }
};

export const updateRole = async (req: Request, res: Response) => {
  try {
    const { roleId } = req.params;
    const { name, description, permissions, isActive, level } = req.body;

    const currentUser = await User.findById(req.user?.id).populate('role');
    const currentUserRole = currentUser?.role as any;
    const currentUserLevel = currentUserRole?.level || 0;
    
    const role = await Role.findById(roleId);
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }
    
    const canModifyHighLevel = currentUserLevel > 80 && role.level > 80;
    const isRoot = currentUserRole?.name?.toLowerCase() === 'root';
    
    if (!isRoot && !canModifyHighLevel) {
      return res.status(403).json({ 
        message: 'Only Root or users with level > 80 can update high-level roles' 
      });
    }

    if (role.name?.toLowerCase() === 'root') {
      return res.status(403).json({ 
        message: 'Cannot modify Root role. Root role is system-protected.' 
      });
    }

    if (role.isDefault && (name !== undefined || level !== undefined)) {
      if (name !== undefined && name !== role.name) {
        return res.status(403).json({ 
          message: 'Cannot modify name of default system roles. You can update permissions, description, and status only.' 
        });
      }
      if (level !== undefined && level !== role.level) {
        return res.status(403).json({ 
          message: 'Cannot modify level of default system roles. You can update permissions, description, and status only.' 
        });
      }
    }
    
    if (!isRoot && canModifyHighLevel && permissions !== undefined) {
      const currentPermissions = role.permissions || [];
      const newPermissions = permissions || [];
      const removedPerms = currentPermissions.filter((p: string) => !newPermissions.includes(p));
      
      if (removedPerms.length === 0 && newPermissions.length > currentPermissions.length) {
        return res.status(403).json({ 
          message: 'You can only reduce permissions for high-level roles, not add new ones' 
        });
      }
    }
    
    if (permissions !== undefined) {
      if (permissions.length > 0) {
        const validPermissions = await Permission.find({ 
          name: { $in: permissions },
          isActive: true 
        });
        
        const validPermissionNames = validPermissions.map(p => p.name);
        const invalidPermissions = permissions.filter(
          (p: string) => !validPermissionNames.includes(p)
        );
        
        if (invalidPermissions.length > 0) {
          return res.status(400).json({ 
            message: 'Invalid permissions provided',
            invalidPermissions 
          });
        }
      }
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (permissions !== undefined) updateData.permissions = permissions;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (level !== undefined) updateData.level = level;

    const updatedRole = await Role.findByIdAndUpdate(
      roleId,
      updateData,
      { new: true }
    );

    res.json(updatedRole);
  } catch (error) {
    res.status(500).json({ message: 'Error updating role', error });
  }
};

export const deleteRole = async (req: Request, res: Response) => {
  try {
    const { roleId } = req.params;
    
    const currentUser = await User.findById(req.user?.id).populate('role');
    const currentUserRole = currentUser?.role as any;
    
    if (currentUserRole?.name?.toLowerCase() !== 'root') {
      return res.status(403).json({ 
        message: 'Only Root user can delete roles' 
      });
    }
    
    const role = await Role.findById(roleId);
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    if (role.name?.toLowerCase() === 'root') {
      return res.status(403).json({ 
        message: 'Cannot delete Root role' 
      });
    }

    if (role.isDefault) {
      return res.status(403).json({ 
        message: 'Cannot delete default system roles' 
      });
    }
    
    const usersWithRole = await User.find({ role: roleId });
    if (usersWithRole.length > 0) {
      return res.status(400).json({ 
        message: `Cannot delete role. It is assigned to ${usersWithRole.length} user(s).` 
      });
    }

    await Role.findByIdAndDelete(roleId);
    res.json({ message: 'Role deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting role', error });
  }
};

export const bulkDeleteRoles = async (req: Request, res: Response) => {
  try {
    const { roleIds } = req.body;
    
    const currentUser = await User.findById(req.user?.id).populate('role');
    const currentUserRole = currentUser?.role as any;
    
    if (currentUserRole?.name?.toLowerCase() !== 'root') {
      return res.status(403).json({ 
        message: 'Only Root user can delete roles' 
      });
    }
    
    if (!roleIds || !Array.isArray(roleIds) || roleIds.length === 0) {
      return res.status(400).json({ message: 'Role IDs array is required' });
    }
    
    let deleted = 0;
    const errors: string[] = [];
    
    for (const roleId of roleIds) {
      const role = await Role.findById(roleId);
      if (!role) {
        errors.push(`Role ${roleId} not found`);
        continue;
      }
      
      if (role.name?.toLowerCase() === 'root' || role.isDefault) {
        errors.push(`Cannot delete ${role.name} role`);
        continue;
      }
      
      const usersWithRole = await User.find({ role: roleId });
      if (usersWithRole.length > 0) {
        errors.push(`${role.name} is assigned to ${usersWithRole.length} user(s)`);
        continue;
      }
      
      await Role.findByIdAndDelete(roleId);
      deleted++;
    }
    
    res.json({ 
      message: `Successfully deleted ${deleted} role(s)`,
      deleted,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    res.status(500).json({ message: 'Error bulk deleting roles', error });
  }
};

export const toggleRoleStatus = async (req: Request, res: Response) => {
  try {
    const { roleId } = req.params;
    
    const currentUser = await User.findById(req.user?.id).populate('role');
    const currentUserRole = currentUser?.role as any;
    
    if (currentUserRole?.name?.toLowerCase() !== 'root') {
      return res.status(403).json({ 
        message: 'Only Root user can toggle role status' 
      });
    }
    
    const role = await Role.findById(roleId);
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    if (role.name?.toLowerCase() === 'root') {
      return res.status(403).json({ 
        message: 'Cannot deactivate Root role' 
      });
    }

    role.isActive = !role.isActive;
    await role.save();
    
    res.json({ message: `Role ${role.isActive ? 'activated' : 'deactivated'} successfully`, role });
  } catch (error) {
    res.status(500).json({ message: 'Error toggling role status', error });
  }
};

// Permissions Management
export const getPermissions = async (req: Request, res: Response) => {
  try {
    const permissions = await Permission.find().sort({ category: 1, name: 1 });
    res.json(permissions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching permissions', error });
  }
};

export const createPermission = async (req: Request, res: Response) => {
  try {
    const { name, description, category } = req.body;
    
    const currentUser = await User.findById(req.user?.id).populate('role');
    const currentUserRole = currentUser?.role as any;
    
    if (currentUserRole?.name?.toLowerCase() !== 'root') {
      return res.status(403).json({ 
        message: 'Only Root user can create permissions' 
      });
    }
    
    const existingPermission = await Permission.findOne({ name });
    if (existingPermission) {
      return res.status(400).json({ message: 'Permission already exists' });
    }

    const permission = new Permission({ name, description, category });
    await permission.save();
    
    res.status(201).json(permission);
  } catch (error) {
    res.status(500).json({ message: 'Error creating permission', error });
  }
};

// User Role Assignment
export const assignRolesToUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { roleId } = req.body;

    const currentUser = await User.findById(req.user?.id).populate('role');
    const currentUserRole = currentUser?.role as any;
    const currentUserLevel = currentUserRole?.level || 0;
    const isRoot = currentUserRole?.name?.toLowerCase() === 'root';
    
    if (!isRoot && currentUserLevel <= 80) {
      return res.status(403).json({ 
        message: 'Only Root or users with level > 80 can assign roles' 
      });
    }

    if (!roleId) {
      return res.status(400).json({ message: 'Role ID is required' });
    }

    const role = await Role.findById(roleId);
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    if (role.name?.toLowerCase() === 'root') {
      return res.status(403).json({ 
        message: 'Cannot assign Root role. Only one Root user is allowed.' 
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { role: roleId },
      { new: true }
    ).populate('role').select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error assigning role', error });
  }
};

export const getUserPermissions = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId).populate('role');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const role = user.role as any;
    const permissions = role?.permissions || [];

    res.json({ permissions });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user permissions', error });
  }
};

// Initialize default permissions
export const initializePermissions = async () => {
  const defaultPermissions = [
    // User Management
    { name: 'users.view', description: 'View users list and profiles', category: 'User Management' },
    { name: 'users.create', description: 'Create new user accounts', category: 'User Management' },
    { name: 'users.edit', description: 'Edit user information', category: 'User Management' },
    { name: 'users.delete', description: 'Delete user accounts', category: 'User Management' },
    { name: 'users.manage', description: 'Manage users', category: 'User Management' },
    { name: 'users.assign_roles', description: 'Assign roles to users', category: 'User Management' },
    { name: 'users.reset_password', description: 'Reset user passwords', category: 'User Management' },
    { name: 'users.activate_deactivate', description: 'Activate/deactivate users', category: 'User Management' },
    
    // Employee Management
    { name: 'employees.view', description: 'View employee directory', category: 'Employee Management' },
    { name: 'employees.create', description: 'Add new employees', category: 'Employee Management' },
    { name: 'employees.edit', description: 'Edit employee details', category: 'Employee Management' },
    { name: 'employees.delete', description: 'Remove employees', category: 'Employee Management' },
    { name: 'employees.view_salary', description: 'View salary information', category: 'Employee Management' },
    { name: 'employees.edit_salary', description: 'Edit salary details', category: 'Employee Management' },
    { name: 'attendance.view', description: 'View attendance records', category: 'Employee Management' },
    { name: 'attendance.mark', description: 'Mark attendance', category: 'Employee Management' },
    { name: 'attendance.edit', description: 'Edit attendance records', category: 'Employee Management' },
    { name: 'leaves.view', description: 'View leave requests', category: 'Employee Management' },
    { name: 'leaves.apply', description: 'Apply for leaves', category: 'Employee Management' },
    { name: 'leaves.approve', description: 'Approve/reject leaves', category: 'Employee Management' },
    { name: 'leaves.cancel', description: 'Cancel leave requests', category: 'Employee Management' },
    

    
    // Customer & Vendor Management
    { name: 'customers.view', description: 'View customer list', category: 'Customer & Vendor' },
    { name: 'customers.create', description: 'Add new customers', category: 'Customer & Vendor' },
    { name: 'customers.edit', description: 'Edit customer details', category: 'Customer & Vendor' },
    { name: 'customers.delete', description: 'Delete customers', category: 'Customer & Vendor' },
    { name: 'vendors.view', description: 'View vendor list', category: 'Customer & Vendor' },
    { name: 'vendors.create', description: 'Add new vendors', category: 'Customer & Vendor' },
    { name: 'vendors.edit', description: 'Edit vendor details', category: 'Customer & Vendor' },
    { name: 'vendors.delete', description: 'Delete vendors', category: 'Customer & Vendor' },
    
    // Finance & Accounting
    { name: 'accounts.view', description: 'View chart of accounts', category: 'Finance & Accounting' },
    { name: 'accounts.create', description: 'Create accounts', category: 'Finance & Accounting' },
    { name: 'accounts.edit', description: 'Edit accounts', category: 'Finance & Accounting' },
    { name: 'accounts.delete', description: 'Delete accounts', category: 'Finance & Accounting' },
    { name: 'ledger.view', description: 'View general ledger', category: 'Finance & Accounting' },
    { name: 'ledger.export', description: 'Export ledger data', category: 'Finance & Accounting' },
    { name: 'journal.view', description: 'View journal entries', category: 'Finance & Accounting' },
    { name: 'journal.create', description: 'Create journal entries', category: 'Finance & Accounting' },
    { name: 'journal.edit', description: 'Edit journal entries', category: 'Finance & Accounting' },
    { name: 'journal.delete', description: 'Delete journal entries', category: 'Finance & Accounting' },
    { name: 'journal.approve', description: 'Approve journal entries', category: 'Finance & Accounting' },
    { name: 'journal.post', description: 'Post journal entries', category: 'Finance & Accounting' },
    
    // Invoicing & Billing
    { name: 'invoices.view', description: 'View invoices', category: 'Invoicing & Billing' },
    { name: 'invoices.create', description: 'Create invoices', category: 'Invoicing & Billing' },
    { name: 'invoices.edit', description: 'Edit invoices', category: 'Invoicing & Billing' },
    { name: 'invoices.delete', description: 'Delete invoices', category: 'Invoicing & Billing' },
    { name: 'invoices.send', description: 'Send invoices to customers', category: 'Invoicing & Billing' },
    { name: 'invoices.approve', description: 'Approve invoices', category: 'Invoicing & Billing' },
    { name: 'invoices.cancel', description: 'Cancel invoices', category: 'Invoicing & Billing' },
    { name: 'invoices.download', description: 'Download invoice PDFs', category: 'Invoicing & Billing' },
    { name: 'bills.view', description: 'View bills', category: 'Invoicing & Billing' },
    { name: 'bills.create', description: 'Create bills', category: 'Invoicing & Billing' },
    { name: 'bills.edit', description: 'Edit bills', category: 'Invoicing & Billing' },
    { name: 'bills.delete', description: 'Delete bills', category: 'Invoicing & Billing' },
    
    // Payments & Expenses
    { name: 'payments.view', description: 'View payments', category: 'Payments & Expenses' },
    { name: 'payments.create', description: 'Record payments', category: 'Payments & Expenses' },
    { name: 'payments.edit', description: 'Edit payments', category: 'Payments & Expenses' },
    { name: 'payments.delete', description: 'Delete payments', category: 'Payments & Expenses' },
    { name: 'payments.approve', description: 'Approve payments', category: 'Payments & Expenses' },
    { name: 'expenses.view', description: 'View expenses', category: 'Payments & Expenses' },
    { name: 'expenses.create', description: 'Create expenses', category: 'Payments & Expenses' },
    { name: 'expenses.edit', description: 'Edit expenses', category: 'Payments & Expenses' },
    { name: 'expenses.delete', description: 'Delete expenses', category: 'Payments & Expenses' },
    { name: 'expenses.approve', description: 'Approve expenses', category: 'Payments & Expenses' },
    
    // Project Management
    { name: 'projects.view', description: 'View projects', category: 'Project Management' },
    { name: 'projects.create', description: 'Create projects', category: 'Project Management' },
    { name: 'projects.edit', description: 'Edit projects', category: 'Project Management' },
    { name: 'projects.delete', description: 'Delete projects', category: 'Project Management' },
    { name: 'projects.archive', description: 'Archive projects', category: 'Project Management' },
    { name: 'projects.manage_team', description: 'Manage project team', category: 'Project Management' },
    { name: 'tasks.view', description: 'View tasks', category: 'Project Management' },
    { name: 'tasks.create', description: 'Create tasks', category: 'Project Management' },
    { name: 'tasks.edit', description: 'Edit tasks', category: 'Project Management' },
    { name: 'tasks.delete', description: 'Delete tasks', category: 'Project Management' },
    { name: 'tasks.assign', description: 'Assign tasks', category: 'Project Management' },
    { name: 'tasks.change_status', description: 'Change task status', category: 'Project Management' },
    { name: 'tasks.view_all', description: 'View all tasks', category: 'Project Management' },
    
    // Budget & Planning
    { name: 'budgets.view', description: 'View budgets', category: 'Budget & Planning' },
    { name: 'budgets.create', description: 'Create budgets', category: 'Budget & Planning' },
    { name: 'budgets.edit', description: 'Edit budgets', category: 'Budget & Planning' },
    { name: 'budgets.delete', description: 'Delete budgets', category: 'Budget & Planning' },
    { name: 'budgets.approve', description: 'Approve budgets', category: 'Budget & Planning' },
    { name: 'budgets.allocate', description: 'Allocate budget funds', category: 'Budget & Planning' },
    { name: 'budgets.track', description: 'Track budget utilization', category: 'Budget & Planning' },
    
    // Reports & Analytics
    { name: 'reports.view', description: 'View reports', category: 'Reports & Analytics' },
    { name: 'reports.create', description: 'Create custom reports', category: 'Reports & Analytics' },
    { name: 'reports.export', description: 'Export reports', category: 'Reports & Analytics' },
    { name: 'reports.schedule', description: 'Schedule reports', category: 'Reports & Analytics' },
    { name: 'analytics.view', description: 'View analytics dashboard', category: 'Analytics' },
    { name: 'analytics.financial', description: 'View financial analytics', category: 'Analytics' },
    { name: 'analytics.sales', description: 'View sales analytics', category: 'Analytics' },
    { name: 'analytics.inventory', description: 'View inventory analytics', category: 'Analytics' },
    
    
    // System Administration
    { name: 'admin.view', description: 'View admin panel', category: 'System Administration' },
    { name: 'system.view', description: 'View system settings', category: 'System Administration' },
    { name: 'system.manage', description: 'Manage system settings', category: 'System Administration' },
    { name: 'roles.view', description: 'View roles', category: 'System Administration' },
    { name: 'roles.create', description: 'Create roles', category: 'System Administration' },
    { name: 'roles.edit', description: 'Edit roles', category: 'System Administration' },
    { name: 'roles.delete', description: 'Delete roles', category: 'System Administration' },
    { name: 'roles.manage', description: 'Manage roles and permissions', category: 'System Administration' },
    { name: 'permissions.manage', description: 'Manage permissions', category: 'System Administration' },
    { name: 'settings.view', description: 'View system settings', category: 'System Administration' },
    { name: 'settings.edit', description: 'Edit system settings', category: 'System Administration' },
    { name: 'logs.view', description: 'View system logs', category: 'System Administration' },
    { name: 'logs.export', description: 'Export logs', category: 'System Administration' },
    { name: 'audit.view', description: 'View audit trail', category: 'System Administration' },
    { name: 'backups.view', description: 'View backups', category: 'System Administration' },
    { name: 'backups.create', description: 'Create backups', category: 'System Administration' },
    { name: 'backups.restore', description: 'Restore from backup', category: 'System Administration' },
    { name: 'backups.manage', description: 'Manage system backups', category: 'System Administration' },
    { name: 'notifications.manage', description: 'Manage notifications', category: 'System Administration' },
    { name: 'dashboard.view', description: 'View dashboard', category: 'System Administration' },
    { name: 'data.export', description: 'Export data', category: 'System Administration' }
  ];

  try {
    let created = 0;
    let existing = 0;
    for (const permData of defaultPermissions) {
      const existingPerm = await Permission.findOne({ name: permData.name });
      if (!existingPerm) {
        await Permission.create(permData);
        created++;
      } else {
        existing++;
      }
    }
    console.log(`✓ Permissions initialized: ${created} created, ${existing} already exist, ${defaultPermissions.length} total`);
    return { created, existing, total: defaultPermissions.length };
  } catch (error) {
    console.error('Error initializing permissions:', error);
    throw error;
  }
};