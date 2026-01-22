import { Request, Response } from 'express';
import ApprovalRequest from '../models/ApprovalRequest';
import ApprovalConfig from '../models/ApprovalConfig';
import { logger } from '../utils/logger';
import mongoose from 'mongoose';
import { handleApprovalCompletion } from '../integrations/approvalCompletionHandler';

const determineApprovalLevels = async (amount: number, entityType: string) => {
  const config = await ApprovalConfig.findOne({ entityType, isActive: true });
  if (!config) throw new Error('Approval configuration not found');
  return config.levels
    .filter(level => amount >= level.amountThreshold || level.level === 1)
    .map(level => ({
      level: level.level,
      approverRole: level.approverRole,
      approverIds: [],
      amountThreshold: level.amountThreshold,
      status: 'PENDING'
    }));
};

// Create approval request
export const createApprovalRequest = async (req: Request, res: Response) => {
  try {
    const { entityType, entityId, title, description, amount, metadata } = req.body;
    
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const levels = await determineApprovalLevels(amount, entityType);

    const priority = amount > 200000 ? 'HIGH' : amount > 50000 ? 'MEDIUM' : 'LOW';

    const approval = new ApprovalRequest({
      entityType,
      entityId,
      title,
      description,
      amount,
      requestedBy: req.user.id,
      approvalLevels: levels,
      totalLevels: levels.length,
      priority,
      metadata
    });

    await approval.save();

    // TODO: Send notification to approvers
    
    res.status(201).json({ success: true, data: approval });
  } catch (error: any) {
    logger.error('Create approval error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get pending approvals for current user
export const getPendingApprovals = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const User = require('../models/User').default;
    const user = await User.findById(req.user.id).populate('role');
    const userRole = user?.role?.name;

    const approvals = await ApprovalRequest.find({
      status: 'PENDING',
      'approvalLevels.status': 'PENDING',
      'approvalLevels.approverRole': userRole
    })
      .populate('requestedBy', 'name email')
      .sort({ priority: -1, requestedAt: -1 });

    res.json({ success: true, data: approvals });
  } catch (error: any) {
    logger.error('Get pending approvals error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all approvals with filters
export const getAllApprovals = async (req: Request, res: Response) => {
  try {
    const { status, entityType, priority, startDate, endDate, page = 1, limit = 20 } = req.query;
    
    const filter: any = {};
    if (status) filter.status = status;
    if (entityType) filter.entityType = entityType;
    if (priority) filter.priority = priority;
    if (startDate || endDate) {
      filter.requestedAt = {};
      if (startDate) filter.requestedAt.$gte = new Date(startDate as string);
      if (endDate) filter.requestedAt.$lte = new Date(endDate as string);
    }

    const skip = (Number(page) - 1) * Number(limit);
    
    const [approvals, total] = await Promise.all([
      ApprovalRequest.find(filter)
        .populate('requestedBy', 'name email')
        .populate('approvalLevels.approvedBy', 'name email')
        .sort({ requestedAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      ApprovalRequest.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: approvals,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error: any) {
    logger.error('Get all approvals error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get approval by ID
export const getApprovalById = async (req: Request, res: Response) => {
  try {
    const approval = await ApprovalRequest.findById(req.params.id)
      .populate('requestedBy', 'name email')
      .populate('approvalLevels.approvedBy', 'name email');

    if (!approval) {
      return res.status(404).json({ success: false, message: 'Approval not found' });
    }

    res.json({ success: true, data: approval });
  } catch (error: any) {
    logger.error('Get approval error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Approve request
export const approveRequest = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (!req.user) {
      await session.abortTransaction();
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { comments } = req.body;
    const approval = await ApprovalRequest.findById(req.params.id).session(session);

    if (!approval) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: 'Approval not found' });
    }

    if (approval.status !== 'PENDING') {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'Approval already processed' });
    }

    const currentLevel = approval.approvalLevels.find(l => l.level === approval.currentLevel);
    if (!currentLevel) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: 'Current level not found' });
    }

    if (currentLevel.status !== 'PENDING') {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'Level already processed' });
    }

    // Update current level
    currentLevel.status = 'APPROVED';
    currentLevel.approvedBy = new mongoose.Types.ObjectId(req.user.id);
    currentLevel.approvedAt = new Date();
    currentLevel.comments = comments;

    // Check if all levels approved
    const allApproved = approval.approvalLevels.every(l => l.status === 'APPROVED');
    
    if (allApproved) {
      approval.status = 'APPROVED';
      approval.completedAt = new Date();
    } else {
      approval.currentLevel += 1;
    }

    await approval.save({ session });
    await session.commitTransaction();

    // Handle completion if all approved
    if (allApproved) {
      await handleApprovalCompletion(approval._id, 'APPROVED', new mongoose.Types.ObjectId(req.user.id));
    }

    res.json({ success: true, data: approval, message: 'Approved successfully' });
  } catch (error: any) {
    await session.abortTransaction();
    logger.error('Approve request error:', error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    session.endSession();
  }
};

// Reject request
export const rejectRequest = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (!req.user) {
      await session.abortTransaction();
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { reason } = req.body;
    if (!reason) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'Rejection reason required' });
    }

    const approval = await ApprovalRequest.findById(req.params.id).session(session);

    if (!approval) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: 'Approval not found' });
    }

    if (approval.status !== 'PENDING') {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'Approval already processed' });
    }

    const currentLevel = approval.approvalLevels.find(l => l.level === approval.currentLevel);
    if (currentLevel) {
      currentLevel.status = 'REJECTED';
      currentLevel.approvedBy = new mongoose.Types.ObjectId(req.user.id);
      currentLevel.approvedAt = new Date();
      currentLevel.comments = reason;
    }

    approval.status = 'REJECTED';
    approval.completedAt = new Date();

    await approval.save({ session });
    await session.commitTransaction();

    // Handle rejection
    await handleApprovalCompletion(approval._id, 'REJECTED', new mongoose.Types.ObjectId(req.user.id), reason);

    res.json({ success: true, data: approval, message: 'Rejected successfully' });
  } catch (error: any) {
    await session.abortTransaction();
    logger.error('Reject request error:', error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    session.endSession();
  }
};

// Get approval statistics
export const getApprovalStats = async (req: Request, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [pending, underReview, approvedToday, totalAmount, recentApprovals] = await Promise.all([
      ApprovalRequest.countDocuments({ status: 'PENDING', currentLevel: 1 }),
      ApprovalRequest.countDocuments({ status: 'PENDING', currentLevel: { $gt: 1 } }),
      ApprovalRequest.countDocuments({ status: 'APPROVED', completedAt: { $gte: today } }),
      ApprovalRequest.aggregate([
        { $match: { status: 'PENDING' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      ApprovalRequest.find({ status: 'PENDING' })
        .sort({ priority: -1, requestedAt: -1 })
        .limit(5)
        .populate('requestedBy', 'name email')
    ]);

    res.json({
      success: true,
      data: {
        pending,
        underReview,
        approvedToday,
        totalAmount: totalAmount[0]?.total || 0,
        recentApprovals
      }
    });
  } catch (error: any) {
    logger.error('Get approval stats error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get approval history
export const getApprovalHistory = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [approvals, total] = await Promise.all([
      ApprovalRequest.find({ status: { $in: ['APPROVED', 'REJECTED'] } })
        .populate('requestedBy', 'name email')
        .populate('approvalLevels.approvedBy', 'name email')
        .sort({ completedAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      ApprovalRequest.countDocuments({ status: { $in: ['APPROVED', 'REJECTED'] } })
    ]);

    res.json({
      success: true,
      data: approvals,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error: any) {
    logger.error('Get approval history error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Send reminder
export const sendReminder = async (req: Request, res: Response) => {
  try {
    const approval = await ApprovalRequest.findById(req.params.id)
      .populate('approvalLevels.approverIds', 'name email');
    
    if (!approval) {
      return res.status(404).json({ success: false, message: 'Approval not found' });
    }

    const currentLevel = approval.approvalLevels.find(l => l.level === approval.currentLevel);
    if (!currentLevel) {
      return res.status(404).json({ success: false, message: 'Current level not found' });
    }

    // TODO: Send reminder email to approvers
    
    res.json({ success: true, message: 'Reminder sent successfully' });
  } catch (error: any) {
    logger.error('Send reminder error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Search by ID
export const searchById = async (req: Request, res: Response) => {
  try {
    const { query } = req.query;
    const approvals = await ApprovalRequest.find({
      $or: [
        { _id: { $regex: query, $options: 'i' } },
        { title: { $regex: query, $options: 'i' } }
      ]
    })
      .populate('requestedBy', 'name email')
      .limit(10);

    res.json({ success: true, data: approvals });
  } catch (error: any) {
    logger.error('Search error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export default {
  createApprovalRequest,
  getPendingApprovals,
  getAllApprovals,
  getApprovalById,
  approveRequest,
  rejectRequest,
  getApprovalStats,
  getApprovalHistory,
  sendReminder,
  searchById
};
