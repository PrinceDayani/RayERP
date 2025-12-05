import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';

interface UserPayload {
  id?: string;
  email?: string;
  permissions?: string[];
  role?: string | { name: string } | Types.ObjectId;
  [key: string]: any; // Allow additional properties
}

type AuthRequest = Request & {
  user?: UserPayload;
}

const hasPermission = (user: any, permission: string): boolean => {
  if (!user) return false;
  const permissions = user.permissions || [];
  return permissions.includes('*') || permissions.includes(permission);
};

export const requirePermission = (permission: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    if (!hasPermission(req.user, permission)) {
      return res.status(403).json({ 
        success: false, 
        message: `Permission denied: ${permission} required` 
      });
    }

    next();
  };
};

export const canViewBudgets = requirePermission('budgets.view');
export const canCreateBudgets = requirePermission('budgets.create');
export const canEditBudgets = requirePermission('budgets.edit');
export const canDeleteBudgets = requirePermission('budgets.delete');
export const canApproveBudgets = requirePermission('budgets.approve');
export const canAllocateBudgets = requirePermission('budgets.allocate');
export const canTrackBudgets = requirePermission('budgets.track');

// Legacy compatibility
export const canManageBudgets = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  if (hasPermission(req.user, 'budgets.create') || hasPermission(req.user, 'budgets.edit')) {
    return next();
  }

  return res.status(403).json({ 
    success: false, 
    message: 'Permission denied: budgets.create or budgets.edit required' 
  });
};