import { Request, Response } from 'express';
import mongoose from 'mongoose';
import User from '../models/User';
import Employee from '../models/Employee';
import { Role } from '../models/Role';
import Notification from '../models/Notification';
import UserStatusRequest from '../models/UserStatusRequest';
import { logger } from '../utils/logger';

const EMPLOYEE_ID_ATTEMPTS = 10;

// Allocates the next EMP#### id, retrying if a concurrent approval takes it.
const generateEmployeeId = async (): Promise<string | null> => {
  for (let attempt = 0; attempt < EMPLOYEE_ID_ATTEMPTS; attempt++) {
    const last = await Employee.findOne().sort({ createdAt: -1, employeeId: -1 }).select('employeeId').lean();
    const lastIdNum = last ? parseInt(last.employeeId.replace(/\D/g, ''), 10) || 0 : 0;
    const candidate = `EMP${(lastIdNum + 1 + attempt).toString().padStart(4, '0')}`;

    const exists = await Employee.exists({ employeeId: candidate });
    if (!exists) return candidate;
  }
  return null;
};

/**
 * Creates the HR record for a newly approved signup. Only the fields we actually
 * know are set — phone, position, department and salary stay unset until HR
 * completes the profile. Returns null when the user already has an Employee.
 */
const createEmployeeForUser = async (
  userId: mongoose.Types.ObjectId,
  name: string,
  email: string
) => {
  const existing = await Employee.findOne({ $or: [{ user: userId }, { email }] }).select('_id').lean();
  if (existing) {
    logger.info(`Employee record already exists for ${email}; skipping creation`);
    return null;
  }

  const employeeId = await generateEmployeeId();
  if (!employeeId) {
    throw new Error('Failed to allocate a unique employee ID');
  }

  const [firstName, ...rest] = (name || '').trim().split(/\s+/);

  return Employee.create({
    employeeId,
    firstName: firstName || email,
    lastName: rest.join(' '),
    email,
    hireDate: new Date(),
    status: 'active',
    user: userId
  });
};

// Best-effort user-facing mail; a send failure must never fail the decision.
const sendDecisionEmail = async (
  send: (svc: any) => Promise<unknown>,
  context: string
) => {
  try {
    const { default: emailService } = await import('../services/emailService');
    await send(emailService);
  } catch (error: any) {
    logger.warn(`${context} email failed: ${error.message}`);
  }
};

// GET /api/auth/pending-users
export const listPendingUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.find({ status: 'pending_approval' })
      .populate('role', 'name level')
      .select('name email status createdAt')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.status(200).json({
      success: true,
      data: users
    });
  } catch (error: any) {
    logger.error(`List pending users error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error retrieving pending users'
    });
  }
};

// POST /api/auth/pending-users/:id/approve
export const approveUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { roleId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid user id' });
    }
    if (!roleId || !mongoose.Types.ObjectId.isValid(roleId)) {
      return res.status(400).json({ success: false, message: 'A valid role must be specified' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (user.status !== 'pending_approval') {
      return res.status(400).json({
        success: false,
        message: 'This account is not awaiting approval'
      });
    }

    const role = await Role.findById(roleId);
    if (!role || !role.isActive) {
      return res.status(400).json({ success: false, message: 'Invalid role specified' });
    }
    if (role.name?.toLowerCase() === 'root') {
      return res.status(403).json({
        success: false,
        message: 'Cannot assign Root role. Only one Root user is allowed.'
      });
    }

    const approverRole = await Role.findById((req.user as any).role);
    if (!approverRole || role.level >= approverRole.level) {
      return res.status(403).json({
        success: false,
        message: 'You cannot assign a role at or above your own level'
      });
    }

    // The HR record is created first: if it fails the account stays pending
    // rather than going active without an Employee.
    let employee;
    try {
      employee = await createEmployeeForUser(
        user._id as mongoose.Types.ObjectId,
        user.name,
        user.email
      );
    } catch (error: any) {
      logger.error(`Employee creation failed for ${user.email}: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: 'Could not create the employee record. The account was not approved.'
      });
    }

    const previousStatus = user.status;
    user.role = role._id as mongoose.Types.ObjectId;
    user.status = 'active';
    try {
      await user.save();
    } catch (error) {
      if (employee) await Employee.findByIdAndDelete(employee._id);
      throw error;
    }

    if (employee) {
      logger.info(`Employee ${employee.employeeId} created for approved user ${user.email}`);
    }

    await UserStatusRequest.create({
      user: user._id,
      requestedBy: (req.user as any)._id,
      currentStatus: previousStatus,
      requestedStatus: 'active',
      reason: `Signup approved with role ${role.name}`,
      status: 'approved',
      approvedBy: (req.user as any)._id,
      approvedAt: new Date()
    });

    await Notification.create({
      userId: user._id,
      type: 'success',
      title: 'Account approved',
      message: `Your account has been approved with the ${role.name} role. You can now sign in.`,
      priority: 'high',
      actionUrl: '/login'
    });

    await sendDecisionEmail(
      svc => svc.sendAccountApproved(user.email, user.name, role.name),
      'Account approved'
    );

    logger.info(`User ${user.email} approved by ${(req.user as any)._id} with role ${role.name}`);

    const populated = await User.findById(user._id).populate('role', 'name level').select('-password');

    res.status(200).json({
      success: true,
      message: 'User approved',
      data: populated
    });
  } catch (error: any) {
    logger.error(`Approve user error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error approving user'
    });
  }
};

// POST /api/auth/pending-users/:id/reject
export const rejectUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid user id' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (user.status !== 'pending_approval') {
      return res.status(400).json({
        success: false,
        message: 'This account is not awaiting approval'
      });
    }

    const previousStatus = user.status;
    user.status = 'disabled';
    await user.save();

    await UserStatusRequest.create({
      user: user._id,
      requestedBy: (req.user as any)._id,
      currentStatus: previousStatus,
      requestedStatus: 'disabled',
      reason: 'Signup rejected',
      status: 'rejected',
      approvedBy: (req.user as any)._id,
      approvedAt: new Date(),
      rejectionReason: reason
    });

    await sendDecisionEmail(
      svc => svc.sendAccountRejected(user.email, user.name, reason),
      'Account rejected'
    );

    logger.info(`Signup for ${user.email} rejected by ${(req.user as any)._id}`);

    res.status(200).json({
      success: true,
      message: 'User rejected'
    });
  } catch (error: any) {
    logger.error(`Reject user error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error rejecting user'
    });
  }
};
