import { Request, Response } from 'express';
import Employee from '../models/Employee';
import User from '../models/User';
import UserSession from '../models/UserSession';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import { formatDateWithTimezone } from '../utils/timezoneHelper';

// ============================================================================
// LOGGING UTILITY
// ============================================================================
const logger = {
  info: (message: string, meta?: any) => {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, meta || '');
  },
  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error || '');
  },
  warn: (message: string, meta?: any) => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, meta || '');
  },
  debug: (message: string, meta?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEBUG] ${new Date().toISOString()} - ${message}`, meta || '');
    }
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Validates file upload
 */
const validateFile = (file: Express.Multer.File, allowedTypes: string[], maxSize: number) => {
  if (!allowedTypes.includes(file.mimetype)) {
    return { valid: false, error: `Invalid file type. Allowed: ${allowedTypes.join(', ')}` };
  }
  if (file.size > maxSize) {
    return { valid: false, error: `File too large. Max size: ${maxSize / (1024 * 1024)}MB` };
  }
  return { valid: true };
};

/**
 * Sanitizes user input
 */
const sanitizeInput = (input: any): any => {
  if (typeof input === 'string') {
    return input.trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  }
  if (Array.isArray(input)) {
    return input.map(sanitizeInput);
  }
  if (typeof input === 'object' && input !== null) {
    const sanitized: any = {};
    for (const key in input) {
      sanitized[key] = sanitizeInput(input[key]);
    }
    return sanitized;
  }
  return input;
};

// ============================================================================
// DOCUMENT MANAGEMENT
// ============================================================================

interface IDocument {
  _id?: string;
  name: string;
  type: 'Resume' | 'Certificate' | 'ID' | 'Other';
  url: string;
  size: number;
  uploadDate: Date;
}

/**
 * Upload document
 * POST /api/users/profile/documents
 */
export const uploadDocument = async (req: Request, res: Response) => {
  const startTime = Date.now();
  const userId = (req as any).user?.id;

  try {
    logger.info('Document upload initiated', { userId, type: req.body.type });

    // Validation
    if (!req.file) {
      logger.warn('No file provided in upload request', { userId });
      return res.status(400).json({ message: 'No file provided' });
    }

    const { type } = req.body;
    if (!['Resume', 'Certificate', 'ID', 'Other'].includes(type)) {
      logger.warn('Invalid document type', { userId, type });
      return res.status(400).json({ message: 'Invalid document type' });
    }

    // File validation
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/jpg',
      'image/png'
    ];
    const maxSize = 10 * 1024 * 1024; // 10MB

    const validation = validateFile(req.file, allowedTypes, maxSize);
    if (!validation.valid) {
      logger.warn('File validation failed', { userId, error: validation.error });
      return res.status(400).json({ message: validation.error });
    }

    // Find employee
    const employee = await Employee.findOne({ user: userId });
    if (!employee) {
      logger.error('Employee not found', { userId });
      return res.status(404).json({ message: 'Employee profile not found' });
    }

    // Create document object
    const document: IDocument = {
      name: req.file.originalname,
      type: type as IDocument['type'],
      url: `/uploads/${req.file.filename}`,
      size: req.file.size,
      uploadDate: new Date()
    };

    // Add to employee documents array (assuming you'll add this field to schema)
    if (!employee.documents) {
      (employee as any).documents = [];
    }
    (employee as any).documents.push(document);
    await employee.save();

    const duration = Date.now() - startTime;
    logger.info('Document uploaded successfully', {
      userId,
      documentId: document._id,
      type,
      size: req.file.size,
      duration: `${duration}ms`
    });

    res.status(201).json({
      message: 'Document uploaded successfully',
      document
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    logger.error('Document upload failed', {
      userId,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    res.status(500).json({ message: 'Failed to upload document', error: error.message });
  }
};

/**
 * Delete document
 * DELETE /api/users/profile/documents/:id
 */
export const deleteDocument = async (req: Request, res: Response) => {
  const startTime = Date.now();
  const userId = (req as any).user?.id;
  const { id: documentId } = req.params;

  try {
    logger.info('Document deletion initiated', { userId, documentId });

    const employee = await Employee.findOne({ user: userId });
    if (!employee) {
      logger.error('Employee not found', { userId });
      return res.status(404).json({ message: 'Employee profile not found' });
    }

    const documents = (employee as any).documents || [];
    const documentIndex = documents.findIndex((doc: any) => doc._id?.toString() === documentId);

    if (documentIndex === -1) {
      logger.warn('Document not found', { userId, documentId });
      return res.status(404).json({ message: 'Document not found' });
    }

    const document = documents[documentIndex];

    // Delete file from filesystem
    try {
      const filePath = path.join(__dirname, '../../', document.url);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        logger.debug('File deleted from filesystem', { filePath });
      }
    } catch (fileError: any) {
      logger.warn('Failed to delete file from filesystem', { error: fileError.message });
    }

    // Remove from database
    documents.splice(documentIndex, 1);
    (employee as any).documents = documents;
    await employee.save();

    const duration = Date.now() - startTime;
    logger.info('Document deleted successfully', {
      userId,
      documentId,
      duration: `${duration}ms`
    });

    res.json({ message: 'Document deleted successfully' });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    logger.error('Document deletion failed', {
      userId,
      documentId,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    res.status(500).json({ message: 'Failed to delete document', error: error.message });
  }
};

// ============================================================================
// PROFILE UPDATE
// ============================================================================

/**
 * Update profile with enhanced fields
 * PUT /api/users/profile
 */
export const updateProfileEnhanced = async (req: Request, res: Response) => {
  const startTime = Date.now();
  const userId = (req as any).user?.id;

  try {
    logger.info('Profile update initiated', { userId });

    // Sanitize input
    const sanitizedData = sanitizeInput(req.body);
    const {
      name,
      phone,
      skills,
      address,
      bio,
      socialLinks,
      notificationSettings,
      timezone
    } = sanitizedData;

    // Validation
    if (name && typeof name !== 'string') {
      return res.status(400).json({ message: 'Invalid name format' });
    }
    if (phone && !/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/.test(phone)) {
      return res.status(400).json({ message: 'Invalid phone format' });
    }
    if (bio && bio.length > 500) {
      return res.status(400).json({ message: 'Bio must be 500 characters or less' });
    }

    // Find user and employee
    const [user, employee] = await Promise.all([
      User.findById(userId),
      Employee.findOne({ user: userId })
    ]);

    if (!user || !employee) {
      logger.error('User or employee not found', { userId });
      return res.status(404).json({ message: 'Profile not found' });
    }

    // Update user name
    if (name) {
      user.name = name;
      await user.save();
      logger.debug('User name updated', { userId, name });
    }

    // Update employee fields
    const updates: any = {};
    if (phone) updates.phone = phone;
    if (address) updates.address = address;
    if (bio !== undefined) updates.bio = bio;
    if (socialLinks) updates.socialLinks = socialLinks;
    if (notificationSettings) updates.notificationSettings = notificationSettings;
    if (timezone) updates.timezone = timezone;

    // Handle skills - convert to enhanced format
    if (skills && Array.isArray(skills)) {
      updates.skillsEnhanced = skills.map((s: any) => ({
        skill: s.skill,
        level: s.level || 'Intermediate',
        lastUpdated: new Date()
      }));
      // Also update legacy skills field for backward compatibility
      updates.skills = skills.map((s: any) => s.skill);
      logger.debug('Skills updated', { userId, skillCount: skills.length });
    }

    // Apply updates
    Object.assign(employee, updates);
    await employee.save();

    const duration = Date.now() - startTime;
    logger.info('Profile updated successfully', {
      userId,
      updatedFields: Object.keys(updates),
      duration: `${duration}ms`
    });

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      },
      employee: {
        phone: employee.phone,
        address: employee.address,
        bio: (employee as any).bio,
        socialLinks: (employee as any).socialLinks,
        skills: employee.skillsEnhanced || employee.skills,
        timezone: (employee as any).timezone
      }
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    logger.error('Profile update failed', {
      userId,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    res.status(500).json({ message: 'Failed to update profile', error: error.message });
  }
};

// ============================================================================
// SECURITY - LOGIN HISTORY
// ============================================================================

interface ILoginHistory {
  _id: string;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  location?: string;
  success: boolean;
}

/**
 * Get login history
 * GET /api/users/login-history
 */
export const getLoginHistory = async (req: Request, res: Response) => {
  const startTime = Date.now();
  const userId = (req as any).user?.id;

  try {
    logger.info('Fetching login history', { userId });

    // Fetch last 10 login attempts from UserSession
    const sessions = await UserSession.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('createdAt ipAddress deviceInfo isActive')
      .lean();

    const loginHistory: ILoginHistory[] = sessions.map(session => ({
      _id: session._id.toString(),
      timestamp: session.createdAt,
      ipAddress: session.ipAddress,
      userAgent: session.deviceInfo.userAgent,
      location: session.location?.city || session.location?.country,
      success: session.isActive
    }));

    const duration = Date.now() - startTime;
    logger.info('Login history fetched successfully', {
      userId,
      count: loginHistory.length,
      duration: `${duration}ms`
    });

    res.json(loginHistory);
  } catch (error: any) {
    const duration = Date.now() - startTime;
    logger.error('Failed to fetch login history', {
      userId,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    res.status(500).json({ message: 'Failed to fetch login history', error: error.message });
  }
};

// ============================================================================
// SECURITY - ACTIVE SESSIONS
// ============================================================================

interface IActiveSession {
  _id: string;
  device: string;
  browser: string;
  ipAddress: string;
  lastActive: Date;
  current: boolean;
}

/**
 * Get active sessions
 * GET /api/users/active-sessions
 */
export const getActiveSessions = async (req: Request, res: Response) => {
  const startTime = Date.now();
  const userId = (req as any).user?.id;
  const currentSessionId = (req as any).sessionId; // Assuming you set this in auth middleware

  try {
    logger.info('Fetching active sessions', { userId });

    const sessions = await UserSession.find({
      user: userId,
      isActive: true,
      expiresAt: { $gt: new Date() }
    })
      .sort({ lastActive: -1 })
      .select('sessionId deviceInfo ipAddress lastActive')
      .lean();

    const activeSessions: IActiveSession[] = sessions.map(session => ({
      _id: session._id.toString(),
      device: `${session.deviceInfo.os || 'Unknown'} ${session.deviceInfo.deviceType || ''}`.trim(),
      browser: session.deviceInfo.browser || 'Unknown',
      ipAddress: session.ipAddress,
      lastActive: session.lastActive,
      current: session.sessionId === currentSessionId
    }));

    const duration = Date.now() - startTime;
    logger.info('Active sessions fetched successfully', {
      userId,
      count: activeSessions.length,
      duration: `${duration}ms`
    });

    res.json(activeSessions);
  } catch (error: any) {
    const duration = Date.now() - startTime;
    logger.error('Failed to fetch active sessions', {
      userId,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    res.status(500).json({ message: 'Failed to fetch active sessions', error: error.message });
  }
};

/**
 * Revoke session
 * DELETE /api/users/sessions/:id
 */
export const revokeSession = async (req: Request, res: Response) => {
  const startTime = Date.now();
  const userId = (req as any).user?.id;
  const { id: sessionId } = req.params;

  try {
    logger.info('Session revocation initiated', { userId, sessionId });

    // Validate session ID
    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      logger.warn('Invalid session ID format', { userId, sessionId });
      return res.status(400).json({ message: 'Invalid session ID' });
    }

    // Find and revoke session
    const session = await UserSession.findOne({
      _id: sessionId,
      user: userId
    });

    if (!session) {
      logger.warn('Session not found', { userId, sessionId });
      return res.status(404).json({ message: 'Session not found' });
    }

    // Prevent revoking current session
    const currentSessionId = (req as any).sessionId;
    if (session.sessionId === currentSessionId) {
      logger.warn('Attempted to revoke current session', { userId, sessionId });
      return res.status(400).json({ message: 'Cannot revoke current session' });
    }

    // Revoke session
    session.isActive = false;
    await session.save();

    const duration = Date.now() - startTime;
    logger.info('Session revoked successfully', {
      userId,
      sessionId,
      duration: `${duration}ms`
    });

    res.json({ message: 'Session revoked successfully' });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    logger.error('Session revocation failed', {
      userId,
      sessionId,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    res.status(500).json({ message: 'Failed to revoke session', error: error.message });
  }
};

// ============================================================================
// PROFILE SETTINGS API (NEW)
// ============================================================================

/**
 * Get current user profile
 * GET /api/profile
 */
export const getProfile = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;

  try {
    const [user, employee] = await Promise.all([
      User.findById(userId).populate('role').select('-password'),
      Employee.findOne({ user: userId })
    ]);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      profile: {
        firstName: user.name?.split(' ')[0] || '',
        lastName: user.name?.split(' ').slice(1).join(' ') || '',
        email: user.email,
        phone: employee?.phone || '',
        jobTitle: employee?.jobTitle || '',
        bio: (employee as any)?.bio || '',
        avatarUrl: (employee as any)?.avatarUrl || '',
        role: (user.role as any)?.name || '',
        department: employee?.department || ''
      }
    });
  } catch (error: any) {
    logger.error('Get profile failed', { userId, error: error.message });
    res.status(500).json({ success: false, message: 'Failed to fetch profile' });
  }
};

/**
 * Update user profile
 * PUT /api/profile
 */
export const updateProfile = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;

  try {
    const { firstName, lastName, phone, jobTitle, bio } = sanitizeInput(req.body);

    // Validation
    if (bio && bio.length > 500) {
      return res.status(400).json({ success: false, message: 'Bio must be 500 characters or less' });
    }
    if (phone && !/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/.test(phone)) {
      return res.status(400).json({ success: false, message: 'Invalid phone format' });
    }

    const [user, employee] = await Promise.all([
      User.findById(userId),
      Employee.findOne({ user: userId })
    ]);

    if (!user || !employee) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    // Update user name
    if (firstName || lastName) {
      user.name = `${firstName || ''} ${lastName || ''}`.trim();
      await user.save();
    }

    // Update employee fields
    if (phone !== undefined) employee.phone = phone;
    if (jobTitle !== undefined) employee.jobTitle = jobTitle;
    if (bio !== undefined) (employee as any).bio = bio;
    await employee.save();

    logger.info('Profile updated', { userId });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      profile: {
        firstName: user.name?.split(' ')[0] || '',
        lastName: user.name?.split(' ').slice(1).join(' ') || '',
        email: user.email,
        phone: employee.phone,
        jobTitle: employee.jobTitle,
        bio: (employee as any).bio
      }
    });
  } catch (error: any) {
    logger.error('Update profile failed', { userId, error: error.message });
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
};

/**
 * Upload avatar
 * POST /api/profile/avatar
 */
export const uploadAvatar = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;

  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file provided' });
    }

    // Validate file
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    const validation = validateFile(req.file, allowedTypes, maxSize);
    
    if (!validation.valid) {
      return res.status(400).json({ success: false, message: validation.error });
    }

    const employee = await Employee.findOne({ user: userId });
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee profile not found' });
    }

    // Delete old avatar if exists
    if ((employee as any).avatarUrl) {
      try {
        const oldPath = path.join(__dirname, '../../', (employee as any).avatarUrl);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      } catch (err) {
        logger.warn('Failed to delete old avatar', { error: err });
      }
    }

    // Save new avatar
    (employee as any).avatarUrl = `/uploads/${req.file.filename}`;
    await employee.save();

    logger.info('Avatar uploaded', { userId });

    res.json({
      success: true,
      message: 'Avatar uploaded successfully',
      avatarUrl: (employee as any).avatarUrl
    });
  } catch (error: any) {
    logger.error('Avatar upload failed', { userId, error: error.message });
    res.status(500).json({ success: false, message: 'Failed to upload avatar' });
  }
};

/**
 * Delete avatar
 * DELETE /api/profile/avatar
 */
export const deleteAvatar = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;

  try {
    const employee = await Employee.findOne({ user: userId });
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee profile not found' });
    }

    if (!(employee as any).avatarUrl) {
      return res.status(404).json({ success: false, message: 'No avatar to delete' });
    }

    // Delete file
    try {
      const filePath = path.join(__dirname, '../../', (employee as any).avatarUrl);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch (err) {
      logger.warn('Failed to delete avatar file', { error: err });
    }

    // Remove from database
    (employee as any).avatarUrl = undefined;
    await employee.save();

    logger.info('Avatar deleted', { userId });

    res.json({ success: true, message: 'Avatar deleted successfully' });
  } catch (error: any) {
    logger.error('Avatar deletion failed', { userId, error: error.message });
    res.status(500).json({ success: false, message: 'Failed to delete avatar' });
  }
};
