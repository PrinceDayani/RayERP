//path: backend/src/controllers/authController.ts

import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { Role } from '../models/Role';
import { logger } from '../utils/logger';
import { seedDefaultRoles, ensureRootRole } from '../utils/seedDefaultRoles';
import { generateDeviceFingerprint, compareFingerprints, isSuspiciousChange } from '../utils/deviceFingerprint';

// Register a new user
export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, roleId } = req.body;

    // Check if all fields are provided
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    await seedDefaultRoles();

    let assignedRoleId = roleId;
    const usersCount = await User.countDocuments();

    if (usersCount === 0) {
      // First user is Root
      const rootRole = await ensureRootRole();
      if (!rootRole) {
        return res.status(500).json({
          success: false,
          message: 'System error: Root role not found'
        });
      }
      assignedRoleId = rootRole._id;
    } else {
      // Check if trying to create another Root user
      const role = await Role.findById(assignedRoleId || '');
      if (role?.name === 'Root') {
        const rootExists = await User.findOne().populate('role');
        if (rootExists && (rootExists.role as any)?.name === 'Root') {
          return res.status(403).json({
            success: false,
            message: 'Root user already exists. Only one Root user is allowed.'
          });
        }
      }

      if (!assignedRoleId) {
        const defaultRole = await Role.findOne({ isDefault: true }).sort({ level: 1 });
        assignedRoleId = defaultRole?._id;
      }
    }

    // Verify role exists
    const role = await Role.findById(assignedRoleId);
    if (!role) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role specified'
      });
    }

    if (req.user) {
      const currentUserRole = await Role.findById((req.user as any).role);

      if (role.name?.toLowerCase() === 'root') {
        return res.status(403).json({
          success: false,
          message: 'Cannot assign Root role. Only one Root user is allowed.'
        });
      }

      if (currentUserRole && role.level >= currentUserRole.level) {
        return res.status(403).json({
          success: false,
          message: 'You cannot create users with equal or higher role level'
        });
      }
    }

    // Create new user
    const user = await User.create({
      name,
      email,
      password,
      role: assignedRoleId
    });

    // Populate role and remove password
    const populatedUser = await User.findById(user._id).populate('role').select('-password');

    logger.info(`User registered: ${email} with role: ${role.name}`);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: populatedUser,
    });
  } catch (error: any) {
    logger.error(`Registration error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: error.message || 'An error occurred during registration',
    });
  }
};

/**
* Check if system requires initial setup (no users exist)
*/
export const checkInitialSetup = async (req: Request, res: Response) => {
  try {
    // Check if any users exist in the system
    const usersCount = await User.countDocuments();
    const isInitialSetup = usersCount === 0;

    res.status(200).json({
      success: true,
      isInitialSetup
    });
  } catch (error: any) {
    logger.error(`Check initial setup error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: error.message || 'Error checking initial setup status',
    });
  }
};

// Login user
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    logger.info(`Login attempt for email: ${email}`);

    // Check if email and password are provided
    if (!email || !password) {
      logger.warn('Login attempt without email or password');
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find user by email and include password in the result
    const user = await User.findOne({ email }).select('+password').populate('role');

    // Check if user exists
    if (!user) {
      logger.warn(`Login attempt for non-existent user: ${email}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if password is correct
    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
      logger.warn(`Invalid password for user: ${email}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check user status
    const userStatus = user.status || 'active';
    if (userStatus === 'disabled') {
      logger.warn(`Login attempt for disabled user: ${email}`);
      return res.status(403).json({
        success: false,
        message: 'Your account has been disabled. Please contact administrator.',
        code: 'ACCOUNT_DISABLED'
      });
    }
    if (userStatus === 'inactive') {
      logger.warn(`Login attempt for inactive user: ${email}`);
      return res.status(403).json({
        success: false,
        message: 'Your account is inactive. Please contact administrator.',
        code: 'ACCOUNT_INACTIVE'
      });
    }
    if (userStatus === 'pending_approval') {
      logger.warn(`Login attempt for pending approval user: ${email}`);
      return res.status(403).json({
        success: false,
        message: 'Your account is pending approval. Please wait for administrator approval.',
        code: 'ACCOUNT_PENDING_APPROVAL'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = user.generateAuthToken();
    const refreshToken = user.generateRefreshToken();

    // Generate device fingerprint
    const deviceFingerprint = generateDeviceFingerprint(req as any);

    // Create session with 2-session limit
    const UserSession = (await import('../models/UserSession')).default;
    const tokenHash = UserSession.hashToken(token);
    const refreshTokenHash = UserSession.hashToken(refreshToken);
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const deviceInfo = UserSession.parseUserAgent(userAgent);
    const ipAddress = req.ip || req.socket.remoteAddress || 'Unknown';

    // Get JWT expiration
    const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '15m';
    const jwtRefreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
    const expiresAt = new Date();
    if (jwtRefreshExpiresIn.endsWith('d')) {
      expiresAt.setDate(expiresAt.getDate() + parseInt(jwtRefreshExpiresIn));
    } else if (jwtRefreshExpiresIn.endsWith('h')) {
      expiresAt.setHours(expiresAt.getHours() + parseInt(jwtRefreshExpiresIn));
    }

    // Create new session
    await UserSession.create({
      user: user._id,
      tokenHash,
      refreshTokenHash,
      deviceInfo: {
        userAgent,
        deviceType: deviceInfo.deviceType,
        browser: deviceInfo.browser,
        os: deviceInfo.os
      },
      deviceFingerprint,
      ipAddress,
      expiresAt
    });

    // Enforce 2-session limit: delete oldest sessions if more than 2
    const userSessions = await UserSession.find({
      user: user._id,
      isActive: true,
      expiresAt: { $gt: new Date() }
    }).sort({ createdAt: 1 }); // Sort by oldest first

    if (userSessions.length > 2) {
      const sessionsToDelete = userSessions.slice(0, userSessions.length - 2);
      await UserSession.deleteMany({
        _id: { $in: sessionsToDelete.map(s => s._id) }
      });
      logger.info(`Revoked ${sessionsToDelete.length} old session(s) for user ${user.email}`);
    }

    const nodeEnv = process.env.NODE_ENV;
    if (!nodeEnv) {
      logger.error('NODE_ENV environment variable is required');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error'
      });
    }

    // Set HTTP-only cookies with the tokens
    res.cookie('token', token, {
      httpOnly: true,
      secure: nodeEnv === 'production',
      sameSite: nodeEnv === 'production' ? 'strict' : 'lax',
      maxAge: 15 * 60 * 1000, // 15 minutes
      path: '/'
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: nodeEnv === 'production',
      sameSite: nodeEnv === 'production' ? 'strict' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/'
    });

    // Create clean user object for response (remove password)
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    logger.info(`User logged in successfully: ${email}`);

    // Log login activity with device fingerprint
    const { logActivity } = await import('../utils/activityLogger');
    await logActivity({
      userId: user._id.toString(),
      userName: user.name,
      action: 'login',
      resource: 'User Session',
      resourceType: 'auth',
      details: `User ${user.name} logged in successfully`,
      metadata: {
        email: user.email,
        role: (user.role as any)?.name,
        loginTime: new Date().toISOString(),
        deviceFingerprint: deviceFingerprint.hash,
        deviceType: deviceInfo.deviceType,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        fingerprintConfidence: deviceFingerprint.confidence
      },
      category: 'security',
      severity: 'low',
      ipAddress: req.ip || req.socket.remoteAddress || 'unknown'
    });

    // Emit real-time activity
    const { RealTimeEmitter } = await import('../utils/realTimeEmitter');
    await RealTimeEmitter.emitActivityLog({
      type: 'auth',
      message: `${user.name} logged in`,
      user: user.name,
      userId: user._id.toString(),
      metadata: { email: user.email, role: (user.role as any)?.name }
    });

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      user: userResponse,
      token,
      refreshToken,
    });
  } catch (error: any) {
    logger.error(`Login error for ${req.body?.email}: ${error.message}`, error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred during login. Please try again.',
    });
  }
};

// Get current user (me)
export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    // User is already attached to req by the auth middleware
    const user = req.user;

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error: any) {
    logger.error(`Get current user error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: error.message || 'Error retrieving user information',
    });
  }
};

// Check authentication status
export const checkAuth = async (req: Request, res: Response) => {
  try {
    // User is already attached to req by the auth middleware
    const user = req.user;

    res.status(200).json({
      success: true,
      authenticated: true,
      user,
    });
  } catch (error: any) {
    logger.error(`Check auth error: ${error.message}`);
    res.status(500).json({
      success: false,
      authenticated: false,
      message: error.message || 'Error checking authentication',
    });
  }
};

// Logout user
export const logout = async (req: Request, res: Response) => {
  try {
    // Delete the session from database
    const token = req.headers.authorization?.split(' ')[1] || req.cookies?.token;
    const refreshToken = req.cookies?.refreshToken;
    
    if (token || refreshToken) {
      const UserSession = (await import('../models/UserSession')).default;
      
      if (refreshToken) {
        const refreshTokenHash = UserSession.hashToken(refreshToken);
        await UserSession.deleteOne({ refreshTokenHash });
        logger.info('Session deleted from database');
      } else if (token) {
        const tokenHash = UserSession.hashToken(token);
        await UserSession.deleteOne({ tokenHash });
        logger.info('Session deleted from database');
      }
    }

    // Clear both cookies
    res.cookie('token', 'none', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
    });

    res.cookie('refreshToken', 'none', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
    });

    logger.info('User logged out');

    // Log logout activity
    if (req.user) {
      const { logActivity } = await import('../utils/activityLogger');
      await logActivity({
        userId: req.user._id.toString(),
        userName: req.user.name,
        action: 'logout',
        resource: 'User Session',
        resourceType: 'auth',
        details: `User ${req.user.name} logged out`,
        metadata: {
          email: req.user.email,
          logoutTime: new Date().toISOString()
        },
        category: 'security',
        severity: 'low',
        ipAddress: req.ip || req.socket.remoteAddress || 'unknown'
      });

      // Emit real-time activity
      const { RealTimeEmitter } = await import('../utils/realTimeEmitter');
      await RealTimeEmitter.emitActivityLog({
        type: 'auth',
        message: `${req.user.name} logged out`,
        user: req.user.name,
        userId: req.user._id.toString(),
        metadata: { email: req.user.email }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error: any) {
    logger.error(`Logout error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: error.message || 'Error during logout',
    });
  }
};

// Change password
export const changePassword = async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = (req.user as any)?._id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current and new password'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters'
      });
    }

    const user = await User.findById(userId).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    user.password = newPassword;
    await user.save();

    logger.info(`Password changed for user: ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error: any) {
    logger.error(`Change password error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: error.message || 'Error changing password'
    });
  }
};

// Refresh access token using refresh token
export const refreshAccessToken = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token not provided',
        code: 'NO_REFRESH_TOKEN'
      });
    }

    // Verify refresh token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return res.status(500).json({
        success: false,
        message: 'Server configuration error'
      });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(refreshToken, jwtSecret);
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Refresh token expired - please login again',
          code: 'REFRESH_TOKEN_EXPIRED'
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token',
        code: 'INVALID_REFRESH_TOKEN'
      });
    }

    // Ensure it's a refresh token
    if (decoded.type !== 'refresh') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token type',
        code: 'INVALID_TOKEN_TYPE'
      });
    }

    // Check if session exists and is valid
    const UserSession = (await import('../models/UserSession')).default;
    const refreshTokenHash = UserSession.hashToken(refreshToken);
    const session = await UserSession.findOne({
      refreshTokenHash,
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

    // Find user
    const user = await User.findById(decoded.id).populate('role').select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check user status
    const userStatus = user.status || 'active';
    if (userStatus !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Account is not active',
        code: 'ACCOUNT_NOT_ACTIVE'
      });
    }

    // Generate new access token
    const newAccessToken = user.generateAuthToken();
    const newTokenHash = UserSession.hashToken(newAccessToken);

    // Update session with new access token hash
    await UserSession.updateOne(
      { _id: session._id },
      { 
        tokenHash: newTokenHash,
        lastActive: new Date()
      }
    );

    const nodeEnv = process.env.NODE_ENV;
    if (!nodeEnv) {
      return res.status(500).json({
        success: false,
        message: 'Server configuration error'
      });
    }

    // Set new access token cookie
    res.cookie('token', newAccessToken, {
      httpOnly: true,
      secure: nodeEnv === 'production',
      sameSite: nodeEnv === 'production' ? 'strict' : 'lax',
      maxAge: 15 * 60 * 1000, // 15 minutes
      path: '/'
    });

    logger.info(`Access token refreshed for user: ${user.email}`);

    return res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      token: newAccessToken
    });
  } catch (error: any) {
    logger.error(`Refresh token error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Error refreshing token'
    });
  }
};

// Get current user's sessions
export const getMySessions = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?._id;

    const UserSession = (await import('../models/UserSession')).default;
    const sessions = await UserSession.find({
      user: userId,
      isActive: true,
      expiresAt: { $gt: new Date() }
    }).sort({ lastActive: -1 }).select('-tokenHash -refreshTokenHash');

    // Get current session
    const refreshToken = req.cookies?.refreshToken;
    let currentSessionId = null;
    if (refreshToken) {
      const refreshTokenHash = UserSession.hashToken(refreshToken);
      const currentSession = await UserSession.findOne({ refreshTokenHash });
      currentSessionId = currentSession?.sessionId;
    }

    const sessionsWithCurrent = sessions.map(session => ({
      ...session.toObject(),
      isCurrent: session.sessionId === currentSessionId
    }));

    res.status(200).json({
      success: true,
      sessions: sessionsWithCurrent
    });
  } catch (error: any) {
    logger.error(`Get my sessions error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: error.message || 'Error retrieving sessions'
    });
  }
};

// Revoke a specific session (user's own)
export const revokeMySession = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?._id;
    const { sessionId } = req.params;

    const UserSession = (await import('../models/UserSession')).default;
    const session = await UserSession.findOne({
      sessionId,
      user: userId
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    await UserSession.deleteOne({ _id: session._id });

    logger.info(`Session ${sessionId} revoked by user ${userId}`);

    res.status(200).json({
      success: true,
      message: 'Session revoked successfully'
    });
  } catch (error: any) {
    logger.error(`Revoke my session error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: error.message || 'Error revoking session'
    });
  }
};

// Admin: Get all sessions for any user
export const getUserSessions = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const UserSession = (await import('../models/UserSession')).default;
    const sessions = await UserSession.find({
      user: userId,
      isActive: true,
      expiresAt: { $gt: new Date() }
    }).sort({ lastActive: -1 }).select('-tokenHash -refreshTokenHash').populate('user', 'name email');

    res.status(200).json({
      success: true,
      sessions
    });
  } catch (error: any) {
    logger.error(`Get user sessions error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: error.message || 'Error retrieving user sessions'
    });
  }
};

// Admin: Revoke a specific session for any user
export const revokeUserSession = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    const UserSession = (await import('../models/UserSession')).default;
    const session = await UserSession.findOne({ sessionId });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    await UserSession.deleteOne({ _id: session._id });

    logger.info(`Session ${sessionId} revoked by admin ${(req.user as any)?.name}`);

    // Log activity
    const { logActivity } = await import('../utils/activityLogger');
    await logActivity({
      userId: (req.user as any)?._id.toString(),
      userName: (req.user as any)?.name,
      action: 'revoke_session',
      resource: 'User Session',
      resourceType: 'auth',
      details: `Admin revoked session ${sessionId}`,
      metadata: {
        sessionId,
        targetUserId: session.user.toString()
      },
      category: 'security',
      severity: 'medium',
      ipAddress: req.ip || req.socket.remoteAddress || 'unknown'
    });

    res.status(200).json({
      success: true,
      message: 'Session revoked successfully'
    });
  } catch (error: any) {
    logger.error(`Revoke user session error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: error.message || 'Error revoking session'
    });
  }
};

// Admin: Revoke all sessions for a user
export const revokeAllUserSessions = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const UserSession = (await import('../models/UserSession')).default;
    const result = await UserSession.deleteMany({ user: userId });

    logger.info(`All sessions revoked for user ${userId} by admin ${(req.user as any)?.name}`);

    // Log activity
    const { logActivity } = await import('../utils/activityLogger');
    await logActivity({
      userId: (req.user as any)?._id.toString(),
      userName: (req.user as any)?.name,
      action: 'revoke_all_sessions',
      resource: 'User Session',
      resourceType: 'auth',
      details: `Admin revoked all sessions for user ${userId}`,
      metadata: {
        targetUserId: userId,
        sessionsRevoked: result.deletedCount
      },
      category: 'security',
      severity: 'high',
      ipAddress: req.ip || req.socket.remoteAddress || 'unknown'
    });

    res.status(200).json({
      success: true,
      message: `${result.deletedCount} session(s) revoked successfully`,
      count: result.deletedCount
    });
  } catch (error: any) {
    logger.error(`Revoke all user sessions error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: error.message || 'Error revoking sessions'
    });
  }
};

// Admin: Get all active sessions across all users
export const getAllActiveSessions = async (req: Request, res: Response) => {
  try {
    const UserSession = (await import('../models/UserSession')).default;
    const sessions = await UserSession.find({
      isActive: true,
      expiresAt: { $gt: new Date() }
    }).sort({ lastActive: -1 }).select('-tokenHash -refreshTokenHash').populate('user', 'name email role');

    res.status(200).json({
      success: true,
      sessions,
      count: sessions.length
    });
  } catch (error: any) {
    logger.error(`Get all active sessions error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: error.message || 'Error retrieving sessions'
    });
  }
};