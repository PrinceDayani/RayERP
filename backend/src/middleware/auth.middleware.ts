//path: backend/src/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';

// Extend the Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      projectAccess?: {
        projectId: string;
        accessLevel: 'read' | 'write' | 'admin';
        assignedAt: Date;
      };
    }
  }
}

interface JwtPayload {
  id: string;
  role: string;
}

export const protect = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let token: string | undefined;

    // Check for token in authorization header first, then cookies
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    // Check if token exists
    if (!token || token === 'undefined' || token === 'null') {
      return res.status(401).json({
        success: false,
        message: 'Authentication required - no token provided'
      });
    }

    // Verify token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('JWT_SECRET is not defined in environment variables');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error'
      });
    }

    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;

    // Check if session exists and is valid
    const UserSession = (await import('../models/UserSession')).default;
    const tokenHash = UserSession.hashToken(token);
    const session = await UserSession.findOne({
      tokenHash,
      isActive: true,
      expiresAt: { $gt: new Date() }
    });

    if (!session) {
      return res.status(401).json({
        success: false,
        message: 'Session expired or invalid. Please login again.',
        code: 'SESSION_INVALID'
      });
    }

    // Update last active time (asynchronously, don't wait)
    UserSession.updateOne(
      { _id: session._id },
      { lastActive: new Date() }
    ).catch(err => console.error('Failed to update session lastActive:', err));

    // Store session token hash for session management endpoints
    (req as any).sessionTokenHash = tokenHash;

    // Find user by id and populate role
    const user = await User.findById(decoded.id).populate('role').select('-password');

    // Check if user exists
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User no longer exists'
      });
    }

    // Check user status
    const userStatus = user.status || 'active';
    if (userStatus === 'disabled') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been disabled. Please contact administrator.',
        code: 'ACCOUNT_DISABLED'
      });
    }
    if (userStatus === 'inactive') {
      return res.status(403).json({
        success: false,
        message: 'Your account is inactive. Please contact administrator.',
        code: 'ACCOUNT_INACTIVE'
      });
    }
    if (userStatus === 'pending_approval') {
      return res.status(403).json({
        success: false,
        message: 'Your account is pending approval. Please wait for administrator approval.',
        code: 'ACCOUNT_PENDING_APPROVAL'
      });
    }

    // Attach user to request object with permissions flattened
    req.user = user;

    // Flatten permissions from role to user object for easier access
    if (user.role && typeof user.role === 'object' && 'permissions' in user.role) {
      (req.user as any).permissions = (user.role as any).permissions;
    }

    next();
  } catch (error: any) {
    console.error('Auth middleware error:', error.message);

    if (error.name === 'JsonWebTokenError') {
      if (error.message === 'invalid signature') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token - please login again',
          code: 'INVALID_TOKEN_SIGNATURE'
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Invalid token format',
        code: 'INVALID_TOKEN_FORMAT'
      });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired - please login again',
        code: 'TOKEN_EXPIRED'
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Authentication failed',
      code: 'AUTH_FAILED'
    });
  }
};

// Alias for consistency with admin routes
export const authenticateToken = protect;
export const authMiddleware = protect;

// Fast auth for performance-critical routes
export const fastAuth = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '') || req.cookies?.token;

    if (!token) {
      return res.status(401).json({ success: false, message: 'No token' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    (req as any).user = { _id: decoded.id, role: decoded.role };
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
};