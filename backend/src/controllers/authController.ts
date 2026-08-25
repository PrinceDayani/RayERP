//path: backend/src/controllers/authController.ts

import { Request, Response } from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { Role } from '../models/Role';
import Notification from '../models/Notification';
import { logger } from '../utils/logger';
import { seedDefaultRoles, ensureRootRole, ensurePendingRole } from '../utils/seedDefaultRoles';
import { generateDeviceFingerprint, compareFingerprints, isSuspiciousChange } from '../utils/deviceFingerprint';
import {
  getPolicy,
  isLocked,
  registerFailedLogin,
  clearLoginFailures,
  validatePasswordAgainstPolicy,
  isPasswordReused,
  recordPasswordInHistory,
  verifyTotp,
  consumeRecoveryCode,
  decryptSecret
} from '../services/accountSecurity.service';

const MIN_PASSWORD_LENGTH = 8;

// Window in which the second factor must be presented after a correct password.
const MFA_TOKEN_EXPIRES_IN = '5m';

// Create a user on behalf of an authenticated Admin/Root
export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, roleId } = req.body;

    // This handler is mounted behind `protect`; an anonymous caller must never reach it.
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({
        success: false,
        message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`
      });
    }

    if (!roleId || !mongoose.Types.ObjectId.isValid(roleId)) {
      return res.status(400).json({
        success: false,
        message: 'A valid role must be specified'
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    const role = await Role.findById(roleId);
    if (!role) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role specified'
      });
    }

    if (role.name?.toLowerCase() === 'root') {
      return res.status(403).json({
        success: false,
        message: 'Cannot assign Root role. Only one Root user is allowed.'
      });
    }

    const currentUserRole = await Role.findById((req.user as any).role);
    if (!currentUserRole || role.level >= currentUserRole.level) {
      return res.status(403).json({
        success: false,
        message: 'You cannot create users with equal or higher role level'
      });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role._id,
      status: 'active'
    });

    const populatedUser = await User.findById(user._id).populate('role').select('-password');

    logger.info(`User created by ${(req.user as any)._id}: ${email} with role: ${role.name}`);

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
 * Public bootstrap of the very first (Root) user. Refuses once any user exists,
 * so it cannot be used to self-provision against an initialised system.
 */
export const initialSetup = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    const usersCount = await User.countDocuments();
    if (usersCount > 0) {
      logger.warn(`Initial-setup attempt against an initialised system from ${req.ip}`);
      return res.status(403).json({
        success: false,
        message: 'System is already initialised. Initial setup is no longer available.'
      });
    }

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({
        success: false,
        message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`
      });
    }

    await seedDefaultRoles();

    const rootRole = await ensureRootRole();
    if (!rootRole) {
      return res.status(500).json({
        success: false,
        message: 'System error: Root role not found'
      });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: rootRole._id,
      status: 'active'
    });

    const populatedUser = await User.findById(user._id).populate('role').select('-password');

    logger.info(`Initial setup completed, Root user created: ${email}`);

    res.status(201).json({
      success: true,
      message: 'Root account created successfully',
      user: populatedUser,
    });
  } catch (error: any) {
    logger.error(`Initial setup error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: error.message || 'An error occurred during initial setup',
    });
  }
};

/**
 * Public self-registration. The account is inert until an Admin/Root approves it:
 * it holds the Pending role (level 0, no permissions) and status pending_approval,
 * which login rejects. Any client-supplied roleId is ignored by design.
 */
export const publicSignup = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your name, email and password'
      });
    }

    if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({
        success: false,
        message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists'
      });
    }

    const pendingRole = await ensurePendingRole();
    if (!pendingRole) {
      logger.error('Signup blocked: Pending role could not be resolved');
      return res.status(503).json({
        success: false,
        message: 'Registration is temporarily unavailable. Please try again later.'
      });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: pendingRole._id,
      status: 'pending_approval'
    });

    logger.info(`Signup pending approval: ${user.email}`);

    await notifyApproversOfSignup(user._id.toString(), user.name, user.email);

    res.status(201).json({
      success: true,
      pending: true,
      message: 'Account created. An administrator must approve it before you can sign in.',
    });
  } catch (error: any) {
    logger.error(`Signup error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'An error occurred during registration',
    });
  }
};

/**
 * Best-effort fan-out to approvers. Never throws: a notification or mail failure
 * must not roll back a successful signup.
 */
const notifyApproversOfSignup = async (userId: string, name: string, email: string) => {
  try {
    const approverRoles = await Role.find({ level: { $gte: 80 } }).select('_id');
    if (approverRoles.length === 0) return;

    const approvers = await User.find({
      role: { $in: approverRoles.map(r => r._id) },
      status: 'active'
    }).select('_id email');

    if (approvers.length === 0) return;

    await Notification.insertMany(
      approvers.map(a => ({
        userId: a._id,
        type: 'system' as const,
        title: 'New account awaiting approval',
        message: `${name} (${email}) signed up and is waiting for approval.`,
        priority: 'high' as const,
        actionUrl: '/dashboard/users',
        metadata: { pendingUserId: userId }
      }))
    );

    const { default: emailService } = await import('../services/emailService');
    await Promise.all(
      approvers
        .filter(a => a.email)
        .map(a =>
          emailService
            .sendAccountPendingApproval(a.email, name, email)
            .catch((err: any) =>
              logger.warn(`Approval email failed for ${a.email}: ${err.message}`)
            )
        )
    );
  } catch (error: any) {
    logger.warn(`Failed to notify approvers of signup: ${error.message}`);
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
/**
 * Creates the session record, sets the auth cookies and returns the login
 * response. Shared by password login and two-factor verification so both
 * paths issue a session in exactly the same way.
 */
const issueSession = async (req: Request, res: Response, user: any) => {
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

    logger.info(`User logged in successfully: ${user.email}`);

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
};

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
    const user = await User.findOne({ email })
      .select('+password +failedLoginAttempts +lockedUntil')
      .populate('role');

    // Check if user exists
    if (!user) {
      logger.warn(`Login attempt for non-existent user: ${email}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const policy = await getPolicy();

    // Evaluated before the password so a locked account cannot be used as an
    // oracle for whether a guessed password was correct.
    if (isLocked(user)) {
      logger.warn(`Login attempt on locked account: ${email}`);
      return res.status(423).json({
        success: false,
        message: 'Account temporarily locked after too many failed attempts. Try again later.',
        code: 'ACCOUNT_LOCKED',
        lockedUntil: user.lockedUntil
      });
    }

    // Check if password is correct
    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
      const lockedUntil = await registerFailedLogin(user, policy);
      logger.warn(`Invalid password for user: ${email}`);

      if (lockedUntil) {
        return res.status(423).json({
          success: false,
          message: 'Account temporarily locked after too many failed attempts. Try again later.',
          code: 'ACCOUNT_LOCKED',
          lockedUntil
        });
      }

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

    await clearLoginFailures(user);

    // Credentials are proven but the session is withheld until the second
    // factor is presented. The interim token is purpose-scoped and short-lived,
    // and `protect` rejects it because it is not an access token.
    if (user.twoFactor?.enabled) {
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        logger.error('JWT_SECRET is not defined in environment variables');
        return res.status(500).json({ success: false, message: 'Server configuration error' });
      }

      const mfaToken = jwt.sign({ id: user._id.toString(), type: 'mfa' }, jwtSecret, {
        expiresIn: MFA_TOKEN_EXPIRES_IN
      } as jwt.SignOptions);

      logger.info(`Password accepted for ${email}; awaiting two-factor verification`);

      // success stays false because no session was issued and there is no
      // token in this response. A client that has not been taught about the
      // second step then reports the message instead of storing an undefined
      // token. See CLAUDE.md 14.19 for the mobile contract.
      return res.status(200).json({
        success: false,
        requiresTwoFactor: true,
        code: 'TWO_FACTOR_REQUIRED',
        message: 'Enter the code from your authenticator app',
        mfaToken
      });
    }

    return issueSession(req, res, user);
  } catch (error: any) {
    logger.error(`Login error for ${req.body?.email}: ${error.message}`, error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred during login. Please try again.',
    });
  }
};

/**
 * Second step of login for accounts with two-factor enabled. Exchanges the
 * short-lived MFA token plus a TOTP code (or a single-use recovery code) for a
 * real session.
 */
export const verifyTwoFactorLogin = async (req: Request, res: Response) => {
  try {
    const { mfaToken, code, recoveryCode } = req.body;

    if (!mfaToken || (!code && !recoveryCode)) {
      return res.status(400).json({
        success: false,
        message: 'Provide the two-factor token and an authenticator or recovery code'
      });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      logger.error('JWT_SECRET is not defined in environment variables');
      return res.status(500).json({ success: false, message: 'Server configuration error' });
    }

    let payload: { id: string; type: string };
    try {
      payload = jwt.verify(mfaToken, jwtSecret) as { id: string; type: string };
    } catch {
      return res.status(401).json({
        success: false,
        message: 'Two-factor session expired. Please sign in again.',
        code: 'MFA_TOKEN_INVALID'
      });
    }

    if (payload.type !== 'mfa') {
      return res.status(401).json({ success: false, message: 'Invalid token type', code: 'INVALID_TOKEN_TYPE' });
    }

    const user = await User.findById(payload.id)
      .select('+twoFactor.secret +twoFactor.recoveryCodes +failedLoginAttempts +lockedUntil')
      .populate('role');

    if (!user || !user.twoFactor?.enabled || !user.twoFactor.secret) {
      return res.status(401).json({ success: false, message: 'Two-factor authentication is not active for this account' });
    }

    const policy = await getPolicy();

    if (isLocked(user)) {
      return res.status(423).json({
        success: false,
        message: 'Account temporarily locked after too many failed attempts. Try again later.',
        code: 'ACCOUNT_LOCKED',
        lockedUntil: user.lockedUntil
      });
    }

    let verified = false;

    if (recoveryCode) {
      const remaining = consumeRecoveryCode(recoveryCode, user.twoFactor.recoveryCodes || []);
      if (remaining) {
        user.twoFactor.recoveryCodes = remaining;
        user.markModified('twoFactor');
        await user.save();
        verified = true;
        logger.warn(`Recovery code used for ${user.email}; ${remaining.length} remaining`);
      }
    } else {
      verified = await verifyTotp(code, decryptSecret(user.twoFactor.secret));
    }

    if (!verified) {
      // Second-factor guesses count toward the same lockout budget as passwords.
      const lockedUntil = await registerFailedLogin(user, policy);
      logger.warn(`Failed two-factor verification for ${user.email}`);

      if (lockedUntil) {
        return res.status(423).json({
          success: false,
          message: 'Account temporarily locked after too many failed attempts. Try again later.',
          code: 'ACCOUNT_LOCKED',
          lockedUntil
        });
      }

      return res.status(401).json({ success: false, message: 'Invalid verification code' });
    }

    await clearLoginFailures(user);
    return issueSession(req, res, user);
  } catch (error: any) {
    logger.error(`Two-factor verification error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'An error occurred during verification. Please try again.'
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

    const policy = await getPolicy();
    const strength = validatePasswordAgainstPolicy(newPassword, policy);
    if (!strength.valid) {
      return res.status(400).json({
        success: false,
        message: strength.message
      });
    }

    const user = await User.findById(userId).select('+password +passwordHistory');
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

    if (await isPasswordReused(user, newPassword, policy)) {
      return res.status(400).json({
        success: false,
        message: `Choose a password you have not used in your last ${policy.passwordHistoryCount} passwords`
      });
    }

    recordPasswordInHistory(user, policy);
    user.password = newPassword;
    user.passwordChangedAt = new Date();
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
    // Web sends the refresh token as an httpOnly cookie; native clients hold a
    // Bearer token and have no cookie jar, so they send it in the body instead.
    // It is still verified, type-checked, and matched to an active session below.
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

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