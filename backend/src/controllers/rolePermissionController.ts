import { Request, Response } from 'express';
import { Role } from '../models/Role';
import User from '../models/User';

export const reduceRolePermissions = async (req: Request, res: Response) => {
  try {
    const { roleId } = req.params;
    const { permissionsToRemove } = req.body;

    const currentUser = await User.findById(req.user?.id).populate('role');
    if (!currentUser) {
      return res.status(401).json({ message: 'User not found' });
    }

    const currentUserRole = currentUser.role as any;
    const currentUserLevel = currentUserRole?.level || 0;
    const isRoot = currentUserRole?.name?.toLowerCase() === 'root';

    if (!isRoot && currentUserLevel <= 80) {
      return res.status(403).json({ 
        message: 'Requires role level above 80 to reduce permissions' 
      });
    }

    const role = await Role.findById(roleId);
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    if (!isRoot && role.level <= 80) {
      return res.status(403).json({ 
        message: 'Can only reduce permissions for roles with level > 80' 
      });
    }

    if (role.name?.toLowerCase() === 'root') {
      return res.status(403).json({ 
        message: 'Cannot modify Root role permissions' 
      });
    }

    if (!permissionsToRemove || !Array.isArray(permissionsToRemove) || permissionsToRemove.length === 0) {
      return res.status(400).json({ 
        message: 'permissionsToRemove array is required and must not be empty' 
      });
    }

    const originalCount = role.permissions.length;
    const updatedPermissions = role.permissions.filter(
      (p: string) => !permissionsToRemove.includes(p)
    );

    role.permissions = updatedPermissions;
    await role.save();

    res.json({ 
      success: true,
      message: 'Permissions reduced successfully',
      role,
      removedCount: originalCount - updatedPermissions.length
    });
  } catch (error: any) {
    console.error('Error reducing permissions:', error);
    res.status(500).json({ success: false, message: 'Error reducing permissions', error: error.message });
  }
};

export const getUsersByRoleLevel = async (req: Request, res: Response) => {
  try {
    const { minLevel } = req.query;

    const currentUser = await User.findById(req.user?.id).populate('role');
    if (!currentUser) {
      return res.status(401).json({ message: 'User not found' });
    }

    const currentUserRole = currentUser.role as any;
    const currentUserLevel = currentUserRole?.level || 0;
    const isRoot = currentUserRole?.name?.toLowerCase() === 'root';

    if (!isRoot && currentUserLevel <= 80) {
      return res.status(403).json({ 
        message: 'Requires role level above 80' 
      });
    }

    const level = minLevel ? parseInt(minLevel as string) : 80;
    if (isNaN(level)) {
      return res.status(400).json({ message: 'Invalid minLevel parameter' });
    }

    const roles = await Role.find({ level: { $gt: level }, isActive: true });
    const roleIds = roles.map(r => r._id);

    const users = await User.find({ role: { $in: roleIds }, status: 'active' })
      .populate('role')
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({ success: true, users, count: users.length, minLevel: level });
  } catch (error: any) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, message: 'Error fetching users', error: error.message });
  }
};
