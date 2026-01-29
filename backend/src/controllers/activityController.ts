import { Request, Response } from 'express';
import ActivityLog from '../models/ActivityLog';
import Project from '../models/Project';
import { Role } from '../models/Role';
import mongoose from 'mongoose';
import { registerCacheInvalidator } from '../utils/dashboardCache';

// Activity cache with 5min TTL
let activitiesCache: Map<string, { data: any; timestamp: number }> = new Map();
let statsCache: { data: any; timestamp: number } | null = null;
const CACHE_TTL = 300000; // 5 minutes

const clearActivityCache = () => {
  activitiesCache.clear();
  statsCache = null;
};

registerCacheInvalidator(clearActivityCache);

export const createActivity = async (req: Request, res: Response) => {
  const startTime = Date.now();
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    const { action, resource, resourceType, resourceId, projectId, details, status, metadata, visibility, changes } = req.body;
    const user = (req as any).user;

    let projectName;
    if (projectId) {
      const project = await Project.findById(projectId).select('name').lean();
      projectName = project?.name;
    }

    const activity = await ActivityLog.create({
      user: user?.id || user?._id,
      userName: user?.name || user?.email || 'Unknown',
      action,
      resource,
      resourceType: resourceType || 'other',
      resourceId,
      projectId,
      projectName,
      details,
      status: status || 'success',
      metadata,
      visibility: visibility || 'all',
      ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
      requestId,
      duration: Date.now() - startTime,
      userAgent: req.headers['user-agent'],
      httpMethod: req.method,
      endpoint: req.originalUrl,
      changes
    });

    clearActivityCache();

    console.log(`[Activity Created] ${requestId}`, {
      user: user?.name,
      action,
      resource,
      projectName,
      duration: `${Date.now() - startTime}ms`
    });

    res.status(201).json({
      success: true,
      data: activity
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[Activity Create Error] ${requestId}`, {
      error: error instanceof Error ? error.message : 'Unknown',
      stack: error instanceof Error ? error.stack : undefined,
      duration: `${duration}ms`
    });
    
    res.status(500).json({
      success: false,
      message: 'Error creating activity log',
      error: error instanceof Error ? error.message : 'Unknown error',
      requestId
    });
  }
};

export const getBatchActivities = async (req: Request, res: Response) => {
  const startTime = Date.now();
  const requestId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    const user = (req as any).user;
    const cacheKey = `batch_${user.id}`;
    const cached = activitiesCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`[Batch Activities] ${requestId} - Cache hit`, { duration: `${Date.now() - startTime}ms` });
      return res.status(200).json({ success: true, data: cached.data, cached: true });
    }

    const userRole = await Role.findById(user.role).lean();
    const hasViewAllPermission = userRole?.permissions?.includes('view_all_activities') || userRole?.level >= 80;

    let query: any = {};

    if (hasViewAllPermission) {
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

    activitiesCache.set(cacheKey, { data: activities, timestamp: Date.now() });

    console.log(`[Batch Activities] ${requestId} - Success`, {
      count: activities.length,
      user: user.name,
      hasViewAllPermission,
      duration: `${Date.now() - startTime}ms`
    });

    res.status(200).json({
      success: true,
      data: activities
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[Batch Activities Error] ${requestId}`, {
      error: error instanceof Error ? error.message : 'Unknown',
      stack: error instanceof Error ? error.stack : undefined,
      duration: `${duration}ms`
    });
    
    res.status(500).json({
      success: false,
      message: 'Error fetching activities',
      error: error instanceof Error ? error.message : 'Unknown error',
      requestId
    });
  }
};

export const getActivities = async (req: Request, res: Response) => {
  const startTime = Date.now();
  const requestId = `get_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    const { page = 1, limit = 20, resourceType, projectId, startDate, endDate, action, status, category, severity, userName, projectName } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const user = (req as any).user;
    
    const cacheKey = `activities_${user.id}_${JSON.stringify(req.query)}`;
    const cached = activitiesCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`[Get Activities] ${requestId} - Cache hit`, { duration: `${Date.now() - startTime}ms` });
      return res.status(200).json({ ...cached.data, cached: true });
    }

    const userRole = await Role.findById(user.role).lean();
    const hasViewAllPermission = userRole?.permissions?.includes('view_all_activities') || userRole?.level >= 80;

    let query: any = {};

    if (hasViewAllPermission) {
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

    if (resourceType) query.resourceType = resourceType;
    if (projectId) query.projectId = projectId;
    if (projectName) query.projectName = { $regex: projectName, $options: 'i' };
    if (action) query.action = action;
    if (status) query.status = status;
    if (category) query['metadata.category'] = category;
    if (severity) query['metadata.severity'] = severity;
    if (userName) query.userName = { $regex: userName, $options: 'i' };
    
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

    const response = {
      success: true,
      data: activities,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    };

    activitiesCache.set(cacheKey, { data: response, timestamp: Date.now() });

    console.log(`[Get Activities] ${requestId} - Success`, {
      count: activities.length,
      total,
      page,
      filters: { resourceType, projectId, projectName, action, status },
      user: user.name,
      duration: `${Date.now() - startTime}ms`
    });

    res.status(200).json(response);
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[Get Activities Error] ${requestId}`, {
      error: error instanceof Error ? error.message : 'Unknown',
      stack: error instanceof Error ? error.stack : undefined,
      query: req.query,
      duration: `${duration}ms`
    });
    
    res.status(500).json({
      success: false,
      message: 'Error fetching activities',
      error: error instanceof Error ? error.message : 'Unknown error',
      requestId
    });
  }
};

export const getActivityById = async (req: Request, res: Response) => {
  const startTime = Date.now();
  const requestId = `getById_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    const { id } = req.params;
    const user = (req as any).user;

    const userRole = await Role.findById(user.role).lean();
    const hasViewAllPermission = userRole?.permissions?.includes('view_all_activities') || userRole?.level >= 80;

    const activity = await ActivityLog.findById(id)
      .populate('user', 'name email')
      .populate('projectId', 'name')
      .lean();

    if (!activity) {
      console.warn(`[Get Activity By ID] ${requestId} - Not found`, { id, duration: `${Date.now() - startTime}ms` });
      return res.status(404).json({
        success: false,
        message: 'Activity not found'
      });
    }

    if (!hasViewAllPermission && activity.visibility === 'management') {
      console.warn(`[Get Activity By ID] ${requestId} - Access denied (management only)`, { id, user: user.name });
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const activityUserId = activity.user?._id?.toString() || activity.user?.toString();
    if (!hasViewAllPermission && activity.visibility === 'private' && activityUserId !== user.id) {
      console.warn(`[Get Activity By ID] ${requestId} - Access denied (private)`, { id, user: user.name });
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    console.log(`[Get Activity By ID] ${requestId} - Success`, {
      id,
      action: activity.action,
      resource: activity.resource,
      projectName: activity.projectName,
      duration: `${Date.now() - startTime}ms`
    });

    res.status(200).json({
      success: true,
      data: activity
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[Get Activity By ID Error] ${requestId}`, {
      error: error instanceof Error ? error.message : 'Unknown',
      stack: error instanceof Error ? error.stack : undefined,
      id: req.params.id,
      duration: `${duration}ms`
    });
    
    res.status(500).json({
      success: false,
      message: 'Error fetching activity details',
      error: error instanceof Error ? error.message : 'Unknown error',
      requestId
    });
  }
};

export const getActivityStats = async (req: Request, res: Response) => {
  const startTime = Date.now();
  const requestId = `stats_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    if (statsCache && Date.now() - statsCache.timestamp < CACHE_TTL) {
      console.log(`[Activity Stats] ${requestId} - Cache hit`, { duration: `${Date.now() - startTime}ms` });
      return res.status(200).json({ success: true, data: statsCache.data, cached: true });
    }

    const user = (req as any).user;
    const userRole = await Role.findById(user.role).lean();
    const hasViewAllPermission = userRole?.permissions?.includes('view_all_activities') || userRole?.level >= 80;

    let baseQuery: any = {};
    if (!hasViewAllPermission) {
      const userProjects = await Project.find({
        $or: [
          { team: user.id },
          { members: user.id },
          { manager: user.id },
          { owner: user.id }
        ]
      }).select('_id').lean();

      const projectIds = userProjects.map(p => p._id);
      baseQuery.$or = [
        { visibility: 'all' },
        { visibility: 'project_team', projectId: { $in: projectIds } },
        { user: user.id }
      ];
    } else {
      baseQuery.visibility = { $in: ['all', 'management'] };
    }

    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [totalActivities, todayActivities, weekActivities, monthActivities, resourceTypeStats, actionStats] = await Promise.all([
      ActivityLog.countDocuments(baseQuery),
      ActivityLog.countDocuments({ ...baseQuery, timestamp: { $gte: startOfDay } }),
      ActivityLog.countDocuments({ ...baseQuery, timestamp: { $gte: startOfWeek } }),
      ActivityLog.countDocuments({ ...baseQuery, timestamp: { $gte: startOfMonth } }),
      ActivityLog.aggregate([
        { $match: baseQuery },
        { $group: { _id: '$resourceType', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      ActivityLog.aggregate([
        { $match: baseQuery },
        { $group: { _id: '$action', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ])
    ]);

    const statsData = {
      totalActivities,
      todayActivities,
      weekActivities,
      monthActivities,
      resourceTypeStats,
      actionStats
    };

    statsCache = { data: statsData, timestamp: Date.now() };

    console.log(`[Activity Stats] ${requestId} - Success`, {
      total: totalActivities,
      today: todayActivities,
      week: weekActivities,
      month: monthActivities,
      user: user.name,
      hasViewAllPermission,
      duration: `${Date.now() - startTime}ms`
    });

    res.status(200).json({
      success: true,
      data: statsData
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[Activity Stats Error] ${requestId}`, {
      error: error instanceof Error ? error.message : 'Unknown',
      stack: error instanceof Error ? error.stack : undefined,
      duration: `${duration}ms`
    });
    
    res.status(500).json({
      success: false,
      message: 'Error fetching activity stats',
      error: error instanceof Error ? error.message : 'Unknown error',
      requestId
    });
  }
};