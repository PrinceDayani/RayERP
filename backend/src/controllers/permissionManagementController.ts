import { Request, Response } from 'express';
import { Role } from '../models/Role';
import User from '../models/User';
import Employee from '../models/Employee';
import Department from '../models/Department';

export const assignPermissionsToRole = async (req: Request, res: Response) => {
  try {
    const { roleId } = req.params;
    const { permissions } = req.body;

    const role = await Role.findById(roleId);
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    role.permissions = [...new Set([...role.permissions, ...permissions])];
    await role.save();

    res.json({
      success: true,
      data: role,
      message: 'Permissions assigned successfully'
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const revokePermissionsFromRole = async (req: Request, res: Response) => {
  try {
    const { roleId } = req.params;
    const { permissions } = req.body;

    const role = await Role.findById(roleId);
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    role.permissions = role.permissions.filter(p => !permissions.includes(p));
    await role.save();

    res.json({
      success: true,
      data: role,
      message: 'Permissions revoked successfully'
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getUserEffectivePermissions = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).populate('role');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const permissions = new Set<string>();
    const userRole = user.role as any;

    // Add role permissions
    if (userRole?.permissions) {
      userRole.permissions.forEach((p: string) => permissions.add(p));
    }

    // Add department permissions
    const employee = await Employee.findOne({ email: user.email });
    if (employee) {
      const departmentNames = employee.departments || (employee.department ? [employee.department] : []);
      if (departmentNames.length > 0) {
        const departments = await Department.find({ 
          name: { $in: departmentNames },
          status: 'active'
        });
        departments.forEach(dept => {
          if (dept.permissions) {
            dept.permissions.forEach((p: string) => permissions.add(p));
          }
        });
      }
    }

    res.json({
      success: true,
      data: {
        userId,
        email: user.email,
        role: userRole?.name,
        permissions: Array.from(permissions),
        sources: {
          role: userRole?.permissions || [],
          departments: employee?.departments || []
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const bulkUpdatePermissions = async (req: Request, res: Response) => {
  try {
    const { updates } = req.body; // [{ roleId, permissions }]

    const results = [];
    for (const update of updates) {
      const role = await Role.findById(update.roleId);
      if (role) {
        role.permissions = update.permissions;
        await role.save();
        results.push({ roleId: update.roleId, success: true });
      } else {
        results.push({ roleId: update.roleId, success: false, error: 'Role not found' });
      }
    }

    res.json({
      success: true,
      data: results,
      message: 'Bulk update completed'
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
