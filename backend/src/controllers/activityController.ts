import { Request, Response } from 'express';
import ActivityLog from '../models/ActivityLog';

export const getBatchActivities = async (req: Request, res: Response) => {
  try {
    const activities = await ActivityLog.find()
      .sort({ timestamp: -1 })
      .limit(50)
      .populate('userId', 'name email');

    res.status(200).json({
      success: true,
      data: activities
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching activities',
      error
    });
  }
};

export const getActivities = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const activities = await ActivityLog.find()
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('userId', 'name email');

    const total = await ActivityLog.countDocuments();

    res.status(200).json({
      success: true,
      data: activities,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching activities',
      error
    });
  }
};