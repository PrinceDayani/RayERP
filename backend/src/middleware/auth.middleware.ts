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

    // Find user by id and populate role
    const user = await User.findById(decoded.id).populate('role').select('-password');

    // Check if user exists
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'User no longer exists' 
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