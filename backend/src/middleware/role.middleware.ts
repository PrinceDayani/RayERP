import { Request, Response, NextFunction } from 'express';

export const authorize = (...roleNames: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user || !req.user.role) {
        return res.status(403).json({ 
          success: false,
          message: 'Access forbidden: No role assigned'
        });
      }

      const userRole = req.user.role as any;
      const roleName = (userRole.name || userRole).toLowerCase().trim();
      const roleNamesLower = roleNames.map(r => r.toLowerCase().trim());

      if (!roleNamesLower.includes(roleName)) {
        return res.status(403).json({
          success: false,
          message: 'Access forbidden: Insufficient permissions'
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error checking authorization'
      });
    }
  };
};

export const authorizeMinLevel = (minimumLevel: number) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user || !req.user.role) {
        return res.status(403).json({ 
          success: false,
          message: 'Access forbidden: No role assigned'
        });
      }

      const userRole = req.user.role as any;
      const roleLevel = userRole.level || 0;

      if (roleLevel < minimumLevel) {
        return res.status(403).json({
          success: false,
          message: 'Access forbidden: Insufficient role level'
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error checking authorization'
      });
    }
  };
};

export const requireRole = (allowedRoles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user || !req.user.role) {
        return res.status(403).json({ 
          success: false,
          message: 'Access forbidden: No role assigned'
        });
      }

      const userRole = req.user.role as any;
      const roleName = (userRole.name || userRole).toLowerCase().trim();
      const allowedRolesLower = allowedRoles.map(r => r.toLowerCase().trim());

      if (!allowedRolesLower.includes(roleName)) {
        return res.status(403).json({
          success: false,
          message: 'Access forbidden: Insufficient permissions'
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error checking authorization'
      });
    }
  };
};