//path: backend/src/controllers/authController.ts

import { Request, Response } from 'express';
import User, { UserRole } from '../models/User';
import { logger } from '../utils/logger';

// Register a new user
export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;

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

    // Role assignment logic
    let assignedRole = role || UserRole.NORMAL;
    
    // Only ROOT and SUPER_ADMIN can create other ROOT and SUPER_ADMIN users
    if (req.user) {
      if ((assignedRole === UserRole.ROOT || assignedRole === UserRole.SUPER_ADMIN) && 
          (req.user.role !== UserRole.ROOT && req.user.role !== UserRole.SUPER_ADMIN)) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to create users with this role level'
        });
      }
      
      // Only ROOT can create other ROOT users
      if (assignedRole === UserRole.ROOT && req.user.role !== UserRole.ROOT) {
        return res.status(403).json({
          success: false,
          message: 'Only ROOT users can create other ROOT users'
        });
      }
    } else {
      // For the first user registration (no users exist yet), allow ROOT creation
      const usersCount = await User.countDocuments();
      if (usersCount === 0) {
        // First user can be ROOT
        assignedRole = UserRole.ROOT;
      } else {
        // If not authenticated and not first user, default to NORMAL
        assignedRole = UserRole.NORMAL;
      }
    }

    // Create new user
    const user = await User.create({
      name,
      email,
      password,
      role: assignedRole
    });

    // Remove password from response
    user.password = undefined as any;

    logger.info(`User registered: ${email} with role: ${assignedRole}`);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user,
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
    const user = await User.findOne({ email }).select('+password');

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

    // Set HTTP-only cookie with the token
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
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

    logger.info(`User logged in successfully: ${email} with role: ${user.role}`);

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
export const logout = (req: Request, res: Response) => {
  try {
    res.cookie('token', 'none', {
      expires: new Date(Date.now() + 10 * 1000), // Expires in 10 seconds
      httpOnly: true,
    });

    logger.info('User logged out');

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