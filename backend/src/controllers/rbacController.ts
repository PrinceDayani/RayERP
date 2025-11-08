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
    
    if (currentUserRole?.name?.toLowerCase() !== 'root') {
      return res.status(403).json({ 
        message: 'Only Root user can update roles' 
      });
    }

    const role = await Role.findById(roleId);
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    if (role.name?.toLowerCase() === 'root') {
      return res.status(403).json({ 
        message: 'Cannot modify Root role. Root role is system-protected.' 
      });
    }

    if (role.isDefault && (name || level !== undefined)) {
      return res.status(403).json({ 
        message: 'Cannot modify name or level of default system roles. You can update permissions only.' 
      });
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
    
    if (currentUserRole?.name?.toLowerCase() !== 'root') {
      return res.status(403).json({ 
        message: 'Only Root user can assign roles to users' 
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
    { name: 'view_users', description: 'View users list', category: 'User Management' },
    { name: 'create_user', description: 'Create new users', category: 'User Management' },
    { name: 'update_user', description: 'Update user details', category: 'User Management' },
    { name: 'delete_user', description: 'Delete users', category: 'User Management' },
    

    
    // Inventory Management
    { name: 'view_inventory', description: 'View inventory', category: 'Inventory Management' },
    { name: 'manage_inventory', description: 'Manage inventory levels', category: 'Inventory Management' },
    
    // Customer Management
    { name: 'view_customers', description: 'View customers', category: 'Customer Management' },
    { name: 'create_customer', description: 'Create customers', category: 'Customer Management' },
    { name: 'update_customer', description: 'Update customers', category: 'Customer Management' },
    { name: 'delete_customer', description: 'Delete customers', category: 'Customer Management' },
    
    // Reports & Analytics
    { name: 'view_reports', description: 'View reports', category: 'Reports & Analytics' },
    { name: 'export_data', description: 'Export data', category: 'Reports & Analytics' },
    
    // Project Management
    { name: 'view_projects', description: 'View projects', category: 'Project Management' },
    { name: 'create_project', description: 'Create projects', category: 'Project Management' },
    { name: 'update_project', description: 'Update projects', category: 'Project Management' },
    { name: 'delete_project', description: 'Delete projects', category: 'Project Management' },
    { name: 'manage_projects', description: 'Manage project assignments', category: 'Project Management' },
    
    // System Administration
    { name: 'manage_roles', description: 'Manage roles and permissions', category: 'System Administration' },
    { name: 'system_settings', description: 'Access system settings', category: 'System Administration' },
    { name: 'view_logs', description: 'View system logs', category: 'System Administration' }
  ];

  try {
    for (const permData of defaultPermissions) {
      const existing = await Permission.findOne({ name: permData.name });
      if (!existing) {
        await Permission.create(permData);
      }
    }
    console.log('Default permissions initialized');
  } catch (error) {
    console.error('Error initializing permissions:', error);
  }
};