// path: backend/src/middleware/role.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../models/User';

// Role-based authorization middleware
export const authorize = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Check if user exists and has a role
    if (!req.user || !req.user.role) {
      return res.status(403).json({ 
        success: false,
        message: 'Access forbidden: No role assigned'
      });
    }

    // Check if user's role is included in the allowed roles
    if (!roles.includes(req.user.role as UserRole)) {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden: Insufficient permissions'
      });
    }

    // User has the required role, proceed
    next();
  };
};

// Role hierarchy middleware
export const authorizeHierarchy = (minimumRole: UserRole) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Check if user exists and has a role
    if (!req.user || !req.user.role) {
      return res.status(403).json({ 
        success: false,
        message: 'Access forbidden: No role assigned'
      });
    }

    const roleHierarchy = {
      [UserRole.ROOT]: 4,
      [UserRole.SUPER_ADMIN]: 3,
      [UserRole.ADMIN]: 2,
      [UserRole.NORMAL]: 1
    };

    const userRoleValue = roleHierarchy[req.user.role as UserRole];
    const requiredRoleValue = roleHierarchy[minimumRole];

    // Check if user's role is sufficient in the hierarchy
    if (userRoleValue < requiredRoleValue) {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden: Insufficient permissions'
      });
    }

    // User has sufficient role, proceed
    next();
  };
};

// Simple role requirement middleware
export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({ 
        success: false,
        message: 'Access forbidden: No role assigned'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden: Insufficient permissions'
      });
    }

    next();
  };
};