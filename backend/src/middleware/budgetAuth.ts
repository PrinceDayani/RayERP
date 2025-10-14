import { Request, Response, NextFunction } from 'express';
import Budget from '../models/Budget';

export const canManageBudgets = (req: Request, res: Response, next: NextFunction) => {
  const userRole = (req as any).user?.role;
  const allowedRoles = ['root', 'super_admin', 'admin', 'manager'];
  
  if (!allowedRoles.includes(userRole)) {
    return res.status(403).json({ message: 'Insufficient permissions to manage budgets' });
  }
  
  next();
};

export const canApproveBudgets = (req: Request, res: Response, next: NextFunction) => {
  const userRole = (req as any).user?.role;
  const allowedRoles = ['root', 'super_admin', 'admin', 'manager'];
  
  if (!allowedRoles.includes(userRole)) {
    return res.status(403).json({ message: 'Insufficient permissions to approve budgets' });
  }
  
  next();
};

export const canViewBudgets = (req: Request, res: Response, next: NextFunction) => {
  const userRole = (req as any).user?.role;
  const allowedRoles = ['root', 'super_admin', 'admin', 'manager', 'employee'];
  
  if (!allowedRoles.includes(userRole)) {
    return res.status(403).json({ message: 'Insufficient permissions to view budgets' });
  }
  
  next();
};