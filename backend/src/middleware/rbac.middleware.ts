import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import { Role } from '../models/Role';
import Employee from '../models/Employee';
import Department from '../models/Department';

interface AuthenticatedRequest extends Request {
  user?: any;
}

/**
 * Resolve the role name from a user's role field.
 * Handles:
 * - Populated role object: { name: 'Root', permissions: ['*'] }
 * - Legacy string role: 'root'
 * - ObjectId (not populated): try to look up
 */
function resolveRoleName(role: any): string | null {
  if (!role) return null;
  // Populated role document with name
  if (typeof role === 'object' && role.name) {
    return role.name;
  }
  // Legacy string-based role
  if (typeof role === 'string') {
    return role;
  }
  return null;
}

function resolvePermissions(role: any): string[] {
  if (!role) return [];
  if (typeof role === 'object' && Array.isArray(role.permissions)) {
    return role.permissions;
  }
  return [];
}

/**
 * Check if the role is a root/superuser role (bypasses all permissions).
 */
function isRootRole(roleName: string | null): boolean {
  if (!roleName) return false;
  const normalized = roleName.toLowerCase();
  return normalized === 'root';
}

export const requirePermission = (permission: string) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      // Use the already-populated user from auth middleware (avoid redundant DB call)
      const userRole = req.user.role;
      const roleName = resolveRoleName(userRole);
      
      // Root bypasses all permission checks
      if (isRootRole(roleName)) {
        return next();
      }

      // Check for wildcard permission (*)
      const rolePermissions = resolvePermissions(userRole);
      if (rolePermissions.includes('*')) {
        return next();
      }
      
      const userPermissions = new Set<string>(rolePermissions);

      // Also check flattened permissions on req.user (set by auth middleware)
      if (req.user.permissions && Array.isArray(req.user.permissions)) {
        req.user.permissions.forEach((perm: string) => userPermissions.add(perm));
      }

      // Check department permissions
      const employee = await Employee.findOne({ email: req.user.email });
      if (employee) {
        const departmentNames = employee.departments || (employee.department ? [employee.department] : []);
        if (departmentNames.length > 0) {
          const departments = await Department.find({ 
            name: { $in: departmentNames },
            status: 'active'
          });
          departments.forEach(dept => {
            if (dept.permissions && dept.permissions.length > 0) {
              dept.permissions.forEach((perm: string) => userPermissions.add(perm));
            }
          });
        }
      }

      if (!userPermissions.has(permission)) {
        return res.status(403).json({ 
          message: 'Insufficient permissions'
        });
      }

      next();
    } catch (error) {
      console.error('RBAC middleware error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };
};

export const requireAnyPermission = (permissions: string[]) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      // Use the already-populated user from auth middleware
      const userRole = req.user.role;
      const roleName = resolveRoleName(userRole);
      
      // Root bypasses all permission checks
      if (isRootRole(roleName)) {
        return next();
      }

      // Check for wildcard permission (*)
      const rolePermissions = resolvePermissions(userRole);
      if (rolePermissions.includes('*')) {
        return next();
      }
      
      const userPermissions = new Set<string>(rolePermissions);

      // Also check flattened permissions on req.user
      if (req.user.permissions && Array.isArray(req.user.permissions)) {
        req.user.permissions.forEach((perm: string) => userPermissions.add(perm));
      }

      // Check department permissions
      const employee = await Employee.findOne({ email: req.user.email });
      if (employee) {
        const departmentNames = employee.departments || (employee.department ? [employee.department] : []);
        if (departmentNames.length > 0) {
          const departments = await Department.find({ 
            name: { $in: departmentNames },
            status: 'active'
          });
          departments.forEach(dept => {
            if (dept.permissions && dept.permissions.length > 0) {
              dept.permissions.forEach((perm: string) => userPermissions.add(perm));
            }
          });
        }
      }

      const hasPermission = permissions.some(permission => userPermissions.has(permission));
      
      if (!hasPermission) {
        return res.status(403).json({ 
          message: 'Insufficient permissions'
        });
      }

      next();
    } catch (error) {
      console.error('RBAC middleware error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };
};
