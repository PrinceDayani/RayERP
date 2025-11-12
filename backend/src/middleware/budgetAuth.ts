import { Request, Response, NextFunction } from 'express';
import Budget from '../models/Budget';

export const canManageBudgets = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  const roleName = typeof user?.role === 'string' ? user.role : user?.role?.name || '';
  const userRole = roleName.toLowerCase();
  const allowedRoles = ['root', 'super_admin', 'admin', 'manager', 'superadmin'];
  
  console.log('Budget manage check - User:', user?.email, 'Role:', userRole);
  
  if (!userRole || !allowedRoles.includes(userRole)) {
    return res.status(403).json({ message: 'Insufficient permissions to manage budgets', role: userRole, originalRole: user?.role });
  }
  
  next();
};

export const canApproveBudgets = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  const roleName = typeof user?.role === 'string' ? user.role : user?.role?.name || '';
  const userRole = roleName.toLowerCase();
  const allowedRoles = ['root', 'super_admin', 'admin', 'manager', 'superadmin'];
  
  console.log('Budget approval check - User:', user?.email, 'Role:', userRole, 'Original:', user?.role);
  
  if (!userRole || !allowedRoles.includes(userRole)) {
    return res.status(403).json({ 
      message: 'Insufficient permissions to approve budgets', 
      role: userRole,
      originalRole: user?.role,
      allowedRoles 
    });
  }
  
  next();
};

export const canViewBudgets = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  const roleName = typeof user?.role === 'string' ? user.role : user?.role?.name || '';
  const userRole = roleName.toLowerCase();
  const allowedRoles = ['root', 'super_admin', 'admin', 'manager', 'employee', 'superadmin', 'normal'];
  
  console.log('Budget view check - User:', user?.email, 'Role:', userRole, 'Original:', user?.role);
  
  if (!userRole || !allowedRoles.includes(userRole)) {
    return res.status(403).json({ 
      message: 'Insufficient permissions to view budgets', 
      role: userRole,
      originalRole: user?.role,
      allowedRoles 
    });
  }
  
  next();
};