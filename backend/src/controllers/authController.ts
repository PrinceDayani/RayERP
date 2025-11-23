//path: backend/src/controllers/authController.ts

import { Request, Response } from 'express';
import User from '../models/User';
import { Role } from '../models/Role';
import { logger } from '../utils/logger';
import { seedDefaultRoles, ensureRootRole } from '../utils/seedDefaultRoles';

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

    // Generate JWT token
    const token = user.generateAuthToken();

    const nodeEnv = process.env.NODE_ENV;
    if (!nodeEnv) {
      logger.error('NODE_ENV environment variable is required');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error'
      });
    }

    // Set HTTP-only cookie with the token
    res.cookie('token', token, {
      httpOnly: true,
      secure: nodeEnv === 'production',
      sameSite: nodeEnv === 'production' ? 'strict' : 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
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

    // Emit login activity
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
    res.cookie('token', 'none', {
      expires: new Date(Date.now() + 10 * 1000), // Expires in 10 seconds
      httpOnly: true,
    });

    logger.info('User logged out');

    // Emit logout activity
    if (req.user) {
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