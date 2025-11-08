import { Request, Response } from 'express';
import ActivityLog from '../models/ActivityLog';
import Project from '../models/Project';
import { Role } from '../models/Role';
import mongoose from 'mongoose';

export const createActivity = async (req: Request, res: Response) => {
  try {
    const { action, resource, resourceType, resourceId, projectId, details, status, metadata, visibility } = req.body;
    const user = (req as any).user;

    const activity = await ActivityLog.create({
      user: user?.id || user?._id,
      userName: user?.name || user?.email || 'Unknown',
      action,
      resource,
      resourceType: resourceType || 'other',
      resourceId,
      projectId,
      details,
      status: status || 'success',
      metadata,
      visibility: visibility || 'all',
      ipAddress: req.ip || req.socket.remoteAddress || 'unknown'
    });

    res.status(201).json({
      success: true,
      data: activity
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating activity log',
      error
    });
  }
};

export const getBatchActivities = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const userRole = await Role.findById(user.role).lean();
    const isManagement = userRole && ['ROOT', 'SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(userRole.name);

    let query: any = {};

    if (isManagement) {
      query.visibility = { $in: ['all', 'management'] };
    } else {
      const userProjects = await Project.find({
        $or: [
          { team: user.id },
          { members: user.id },
          { manager: user.id },
          { owner: user.id }
        ]
      }).select('_id').lean();

      const projectIds = userProjects.map(p => p._id);

      query.$or = [
        { visibility: 'all' },
        { visibility: 'project_team', projectId: { $in: projectIds } },
        { user: user.id }
      ];
    }

    const activities = await ActivityLog.find(query)
      .populate('user', 'name email')
      .populate('projectId', 'name')
      .sort({ timestamp: -1 })
      .limit(50)
      .lean();

    res.status(200).json({
      success: true,
      data: activities
    });
  } catch (error) {
    console.error('Error fetching batch activities:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching activities',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getActivities = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, resourceType, projectId, startDate, endDate } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const user = (req as any).user;

    // Get user's role
    const userRole = await Role.findById(user.role).lean();
    const isManagement = userRole && ['ROOT', 'SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(userRole.name);

    // Build query based on user role
    let query: any = {};

    if (isManagement) {
      // Management sees all activities including management-specific ones
      query.visibility = { $in: ['all', 'management'] };
    } else {
      // Regular users see activities from their projects
      const userProjects = await Project.find({
        $or: [
          { team: user.id },
          { members: user.id },
          { manager: user.id },
          { owner: user.id }
        ]
      }).select('_id').lean();

      const projectIds = userProjects.map(p => p._id);

      query.$or = [
        { visibility: 'all' },
        { visibility: 'project_team', projectId: { $in: projectIds } },
        { user: user.id }
      ];
    }

    // Add filters
    if (resourceType) query.resourceType = resourceType;
    if (projectId) query.projectId = projectId;
    
    // Add date range filter
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate as string);
      if (endDate) query.timestamp.$lte = new Date(endDate as string);
    }

    const activities = await ActivityLog.find(query)
      .populate('user', 'name email')
      .populate('projectId', 'name')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const total = await ActivityLog.countDocuments(query);

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
    console.error('Error fetching activities:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching activities',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};