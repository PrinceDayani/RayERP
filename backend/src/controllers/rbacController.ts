import { Request, Response } from 'express';
import { Role } from '../models/Role';
import { Permission } from '../models/Permission';
import User from '../models/User';

// Roles Management
export const getRoles = async (req: Request, res: Response) => {
  try {
    const roles = await Role.find().sort({ createdAt: -1 });
    res.json(roles);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching roles', error });
  }
};

export const createRole = async (req: Request, res: Response) => {
  try {
    const { name, description, permissions } = req.body;
    
    const existingRole = await Role.findOne({ name });
    if (existingRole) {
      return res.status(400).json({ message: 'Role already exists' });
    }

    const role = new Role({ name, description, permissions });
    await role.save();
    
    res.status(201).json(role);
  } catch (error) {
    res.status(500).json({ message: 'Error creating role', error });
  }
};

export const updateRole = async (req: Request, res: Response) => {
  try {
    const { roleId } = req.params;
    const { name, description, permissions, isActive } = req.body;

    const updateData: any = { name, description, permissions };
    if (isActive !== undefined) {
      updateData.isActive = isActive;
    }

    const role = await Role.findByIdAndUpdate(
      roleId,
      updateData,
      { new: true }
    );

    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    res.json(role);
  } catch (error) {
    res.status(500).json({ message: 'Error updating role', error });
  }
};

export const deleteRole = async (req: Request, res: Response) => {
  try {
    const { roleId } = req.params;
    
    // Check if role is assigned to any users
    const usersWithRole = await User.find({ roles: roleId });
    if (usersWithRole.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete role. It is assigned to users.' 
      });
    }

    await Role.findByIdAndUpdate(roleId, { isActive: false });
    res.json({ message: 'Role deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting role', error });
  }
};

export const toggleRoleStatus = async (req: Request, res: Response) => {
  try {
    const { roleId } = req.params;
    
    const role = await Role.findById(roleId);
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
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
    const permissions = await Permission.find({ isActive: true }).sort({ category: 1, name: 1 });
    res.json(permissions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching permissions', error });
  }
};

export const createPermission = async (req: Request, res: Response) => {
  try {
    const { name, description, category } = req.body;
    
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
    const { roleIds } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { roles: roleIds },
      { new: true }
    ).populate('roles').select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const formattedUser = {
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      roles: user.roles || [],
      status: user.status || 'active',
      lastLogin: user.lastLogin || user.createdAt
    };

    res.json(formattedUser);
  } catch (error) {
    res.status(500).json({ message: 'Error assigning roles', error });
  }
};

export const getUserPermissions = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId).populate('roles');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const permissions = new Set<string>();
    
    // Get permissions from all assigned roles
    if (user.roles) {
      for (const role of user.roles as any[]) {
        role.permissions.forEach((permission: string) => permissions.add(permission));
      }
    }

    res.json({ permissions: Array.from(permissions) });
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
    
    // Product Management
    { name: 'view_products', description: 'View products', category: 'Product Management' },
    { name: 'create_product', description: 'Create products', category: 'Product Management' },
    { name: 'update_product', description: 'Update products', category: 'Product Management' },
    { name: 'delete_product', description: 'Delete products', category: 'Product Management' },
    
    // Order Management
    { name: 'view_orders', description: 'View orders', category: 'Order Management' },
    { name: 'create_order', description: 'Create orders', category: 'Order Management' },
    { name: 'update_order', description: 'Update orders', category: 'Order Management' },
    { name: 'delete_order', description: 'Delete orders', category: 'Order Management' },
    
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