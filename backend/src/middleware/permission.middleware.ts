import { Request, Response, NextFunction } from 'express';
import { requirePermission as rbacRequirePermission } from './rbac.middleware';

export const requirePermission = rbacRequirePermission;