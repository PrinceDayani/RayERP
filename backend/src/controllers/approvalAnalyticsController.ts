import { Request, Response } from 'express';
import ApprovalRequest from '../models/ApprovalRequest';
import { logger } from '../utils/logger';

export const getApprovalAnalytics = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    const filter: any = {};
    
    if (startDate || endDate) {
      filter.requestedAt = {};
      if (startDate) filter.requestedAt.$gte = new Date(startDate as string);
      if (endDate) filter.requestedAt.$lte = new Date(endDate as string);
    }

    const [
      totalApprovals,
      approvalsByStatus,
      approvalsByType,
      approvalsByPriority,
      avgApprovalTime,
      topApprovers
    ] = await Promise.all([
      ApprovalRequest.countDocuments(filter),
      
      ApprovalRequest.aggregate([
        { $match: filter },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      
      ApprovalRequest.aggregate([
        { $match: filter },
        { $group: { _id: '$entityType', count: { $sum: 1 }, totalAmount: { $sum: '$amount' } } }
      ]),
      
      ApprovalRequest.aggregate([
        { $match: filter },
        { $group: { _id: '$priority', count: { $sum: 1 } } }
      ]),
      
      ApprovalRequest.aggregate([
        { $match: { ...filter, status: 'APPROVED', completedAt: { $exists: true } } },
        {
          $project: {
            approvalTime: {
              $divide: [{ $subtract: ['$completedAt', '$requestedAt'] }, 1000 * 60 * 60]
            }
          }
        },
        { $group: { _id: null, avgHours: { $avg: '$approvalTime' } } }
      ]),
      
      ApprovalRequest.aggregate([
        { $match: { ...filter, status: 'APPROVED' } },
        { $unwind: '$approvalLevels' },
        { $match: { 'approvalLevels.status': 'APPROVED' } },
        { $group: { _id: '$approvalLevels.approvedBy', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user'
          }
        },
        { $unwind: '$user' },
        { $project: { name: '$user.name', count: 1 } }
      ])
    ]);

    res.json({
      success: true,
      data: {
        totalApprovals,
        approvalsByStatus,
        approvalsByType,
        approvalsByPriority,
        avgApprovalTimeHours: avgApprovalTime[0]?.avgHours || 0,
        topApprovers
      }
    });
  } catch (error: any) {
    logger.error('Get approval analytics error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export default { getApprovalAnalytics };
