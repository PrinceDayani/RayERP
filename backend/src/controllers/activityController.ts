import { Response } from 'express';
import ActivityLog from '../models/ActivityLog';
import Project from '../models/Project';
import mongoose from 'mongoose';
import { registerCacheInvalidator } from '../utils/dashboardCache';
import { io } from '../server';
import UAParser from 'ua-parser-js';
import geoip from 'geoip-lite';
import { AuthRequest } from '../types/express';
import { getUserActivityQuery, clearUserProjectCache } from '../utils/activityQuery';
import { ACTIVITY_BATCH_SIZE, ACTIVITY_EXPORT_LIMIT, CACHE_TTL } from '../constants/activity.constants';
import { getCache, setCache, deleteCachePattern } from '../utils/redis';
import { addHashToActivity, verifyActivityIntegrity, verifyChainIntegrity } from '../utils/activityIntegrity';
import { logger } from '../utils/logger';

// Activity cache - now using Redis with fallback
const clearActivityCache = async () => {
  await deleteCachePattern('activity:*');
  await deleteCachePattern('stats:*');
  clearUserProjectCache();
};

registerCacheInvalidator(clearActivityCache);

// Filter sensitive fields based on user role level
const filterSensitiveFields = (activity: any, roleLevel: number): any => {
  if (roleLevel >= 80) {
    return activity;
  }

  const filtered = { ...activity };
  delete filtered.errorStack;
  delete filtered.userAgent;
  delete filtered.ipAddress;
  delete filtered.sessionId;
  delete filtered.deviceFingerprint;
  delete filtered.browserDetails;
  delete filtered.geolocation;
  
  return filtered;
};

// Helper: Enhanced metadata extraction
const generateDeviceFingerprint = (req: Request): string => {
  const components = [
    req.headers['user-agent'] || '',
    req.headers['accept-language'] || '',
    req.headers['accept-encoding'] || '',
    req.headers['accept'] || '',
  ];
  return Buffer.from(components.join('|')).toString('base64').substring(0, 64);
};

const parseBrowserDetails = (userAgent: string) => {
  const uaParser = new (UAParser as any)(userAgent);
  const result = uaParser.getResult();
  return {
    name: result.browser.name,
    version: result.browser.version,
    os: `${result.os.name} ${result.os.version}`.trim(),
    platform: result.device.type || 'desktop'
  };
};

const getGeolocation = (ip: string) => {
  if (!ip || ip === '::1' || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    return { country: 'Local', city: 'Local', region: 'Local', timezone: Intl.DateTimeFormat().resolvedOptions().timeZone };
  }
  const geo = geoip.lookup(ip);
  if (!geo) return undefined;
  return { country: geo.country, city: geo.city, region: geo.region, timezone: geo.timezone };
};



export const createActivity = async (req: AuthRequest, res: Response) => {
  const startTime = Date.now();
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    const { action, resource, resourceType, resourceId, projectId, details, status, metadata, visibility, changes } = req.body;
    const user = req.user;

    let projectName;
    if (projectId) {
      const project = await Project.findById(projectId).select('name').lean();
      projectName = project?.name;
    }

    const userAgent = req.headers['user-agent'] || '';
    const ip = req.ip || req.socket.remoteAddress || '';

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
      ipAddress: ip,
      requestId,
      duration: Date.now() - startTime,
      userAgent,
      httpMethod: req.method,
      endpoint: req.originalUrl,
      changes,
      deviceFingerprint: generateDeviceFingerprint(req as any),
      browserDetails: parseBrowserDetails(userAgent),
      geolocation: getGeolocation(ip),
      referrerUrl: (req.headers['referer'] || req.headers['referrer']) as string,
      reversible: ['create', 'update', 'delete'].includes(action)
    });

    // Add hash chain for immutability
    await addHashToActivity(activity);
    await activity.save();

    await clearActivityCache();

    // Emit real-time update
    if (io) {
      io.emit('activity:created', activity);
    }

    res.status(201).json({
      success: true,
      data: activity
    });
  } catch (error) {
    logger.error('Error creating activity log', { message: error instanceof Error ? error.message : 'Unknown', requestId });

    res.status(500).json({
      success: false,
      message: 'Error creating activity log',
      error: error instanceof Error ? error.message : 'Unknown error',
      requestId
    });
  }
};

export const getBatchActivities = async (req: AuthRequest, res: Response) => {
  const startTime = Date.now();
  const requestId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    const user = req.user;
    const cacheKey = `activity:batch:${user.id}`;
    
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.status(200).json({ success: true, data: JSON.parse(cached), cached: true });
    }

    const query = await getUserActivityQuery(user.id, user.role);

    const activities = await ActivityLog.find(query)
      .populate('user', 'name email')
      .populate('projectId', 'name')
      .sort({ timestamp: -1 })
      .limit(ACTIVITY_BATCH_SIZE)
      .lean();

    const baseQuery = await getUserActivityQuery(user.id, user.role);
    const roleLevel = baseQuery.visibility?.$in?.includes('management') ? 80 : 0;
    const filteredActivities = activities.map(a => filterSensitiveFields(a, roleLevel));

    await setCache(cacheKey, JSON.stringify(filteredActivities), 300);

    res.status(200).json({
      success: true,
      data: filteredActivities
    });
  } catch (error) {
    logger.error('Error fetching activities', { message: error instanceof Error ? error.message : 'Unknown', requestId });

    res.status(500).json({
      success: false,
      message: 'Error fetching activities',
      error: error instanceof Error ? error.message : 'Unknown error',
      requestId
    });
  }
};

export const getActivities = async (req: AuthRequest, res: Response) => {
  const startTime = Date.now();
  const requestId = `get_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    const { 
      page = 1, 
      limit = 20, 
      resourceType, 
      projectId, 
      startDate, 
      endDate, 
      action, 
      status, 
      category, 
      severity, 
      userName, 
      projectName,
      ipAddress,
      minDuration,
      maxDuration,
      sessionId,
      userAgent,
      cursor,
      useCursor = 'false'
    } = req.query;
    
    const user = req.user;
    const cacheKey = `activity:list:${user.id}:${JSON.stringify(req.query)}`;
    
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.status(200).json({ ...JSON.parse(cached), cached: true });
    }

    const query = await getUserActivityQuery(user.id, user.role);

    if (resourceType) query.resourceType = resourceType;
    if (projectId) query.projectId = projectId;
    if (projectName) query.projectName = { $regex: projectName, $options: 'i' };
    if (action) query.action = action;
    if (status) query.status = status;
    if (category) query['metadata.category'] = category;
    if (severity) query['metadata.severity'] = severity;
    if (userName) query.userName = { $regex: userName, $options: 'i' };
    if (ipAddress) query.ipAddress = { $regex: ipAddress, $options: 'i' };
    if (sessionId) query.sessionId = sessionId;
    if (userAgent) query.userAgent = { $regex: userAgent, $options: 'i' };
    
    if (minDuration || maxDuration) {
      query.duration = {};
      if (minDuration) query.duration.$gte = Number(minDuration);
      if (maxDuration) query.duration.$lte = Number(maxDuration);
    }
    
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate as string);
      if (endDate) query.timestamp.$lte = new Date(endDate as string);
    }

    let activities;
    let total;
    let nextCursor;

    // Cursor-based pagination (more efficient for large datasets)
    if (useCursor === 'true' && cursor) {
      const [timestamp, id] = (cursor as string).split('_');
      query.$or = [
        { timestamp: { $lt: new Date(timestamp) } },
        { timestamp: new Date(timestamp), _id: { $lt: new mongoose.Types.ObjectId(id) } }
      ];

      activities = await ActivityLog.find(query)
        .populate('user', 'name email')
        .populate('projectId', 'name')
        .sort({ timestamp: -1, _id: -1 })
        .limit(Number(limit) + 1)
        .lean();

      if (activities.length > Number(limit)) {
        const lastItem = activities[Number(limit) - 1];
        nextCursor = `${new Date(lastItem.timestamp).getTime()}_${lastItem._id}`;
        activities = activities.slice(0, Number(limit));
      }

      total = await ActivityLog.countDocuments(query);
    } else {
      // Traditional offset pagination (backward compatible)
      const skip = (Number(page) - 1) * Number(limit);
      
      activities = await ActivityLog.find(query)
        .populate('user', 'name email')
        .populate('projectId', 'name')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean();

      total = await ActivityLog.countDocuments(query);
    }

    const baseQuery = await getUserActivityQuery(user.id, user.role);
    const roleLevel = baseQuery.visibility?.$in?.includes('management') ? 80 : 0;
    const filteredActivities = activities.map(a => filterSensitiveFields(a, roleLevel));

    const response: any = {
      success: true,
      data: filteredActivities,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    };

    if (nextCursor) {
      response.pagination.nextCursor = nextCursor;
    }

    await setCache(cacheKey, JSON.stringify(response), 300);

    res.status(200).json(response);
  } catch (error) {
    logger.error('Error fetching activities', { message: error instanceof Error ? error.message : 'Unknown', requestId });

    res.status(500).json({
      success: false,
      message: 'Error fetching activities',
      error: error instanceof Error ? error.message : 'Unknown error',
      requestId
    });
  }
};

export const getActivityById = async (req: AuthRequest, res: Response) => {
  const startTime = Date.now();
  const requestId = `getById_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    const { id } = req.params;
    const user = req.user;

    const baseQuery = await getUserActivityQuery(user.id, user.role);
    const hasViewAllPermission = baseQuery.visibility?.$in?.includes('management');

    const activity = await ActivityLog.findById(id)
      .populate('user', 'name email')
      .populate('projectId', 'name')
      .lean();

    if (!activity) {
      logger.warn('Get activity by id - not found', { id, requestId });
      return res.status(404).json({
        success: false,
        message: 'Activity not found'
      });
    }

    if (!hasViewAllPermission && activity.visibility === 'management') {
      logger.warn('Get activity by id - access denied (management only)', { id, requestId });
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const activityUserId = activity.user?._id?.toString() || activity.user?.toString();
    if (!hasViewAllPermission && activity.visibility === 'private' && activityUserId !== user.id) {
      logger.warn('Get activity by id - access denied (private)', { id, requestId });
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const roleLevel = hasViewAllPermission ? 80 : 0;
    const filteredActivity = filterSensitiveFields(activity, roleLevel);

    res.status(200).json({
      success: true,
      data: filteredActivity
    });
  } catch (error) {
    logger.error('Error fetching activity details', { message: error instanceof Error ? error.message : 'Unknown', id: req.params.id, requestId });

    res.status(500).json({
      success: false,
      message: 'Error fetching activity details',
      error: error instanceof Error ? error.message : 'Unknown error',
      requestId
    });
  }
};

export const getActivityStats = async (req: AuthRequest, res: Response) => {
  const startTime = Date.now();
  const requestId = `stats_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    const cacheKey = 'stats:activity:global';
    const cached = await getCache(cacheKey);
    
    if (cached) {
      return res.status(200).json({ success: true, data: JSON.parse(cached), cached: true });
    }

    const user = req.user;
    const baseQuery = await getUserActivityQuery(user.id, user.role);

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

    await setCache(cacheKey, JSON.stringify(statsData), 300);

    res.status(200).json({
      success: true,
      data: statsData
    });
  } catch (error) {
    logger.error('Error fetching activity stats', { message: error instanceof Error ? error.message : 'Unknown', requestId });

    res.status(500).json({
      success: false,
      message: 'Error fetching activity stats',
      error: error instanceof Error ? error.message : 'Unknown error',
      requestId
    });
  }
};

export const exportActivities = async (req: AuthRequest, res: Response) => {
  const startTime = Date.now();
  const requestId = `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    const { format = 'json', ...filters } = req.query;
    const user = req.user;

    const query = await getUserActivityQuery(user.id, user.role);

    // Apply filters
    if (filters.resourceType) query.resourceType = filters.resourceType;
    if (filters.action) query.action = filters.action;
    if (filters.status) query.status = filters.status;
    if (filters.startDate || filters.endDate) {
      query.timestamp = {};
      if (filters.startDate) query.timestamp.$gte = new Date(filters.startDate as string);
      if (filters.endDate) query.timestamp.$lte = new Date(filters.endDate as string);
    }

    const activities = await ActivityLog.find(query)
      .populate('user', 'name email')
      .populate('projectId', 'name')
      .sort({ timestamp: -1 })
      .limit(ACTIVITY_EXPORT_LIMIT)
      .lean();

    res.status(200).json({
      success: true,
      data: activities,
      count: activities.length
    });
  } catch (error) {
    logger.error('Error exporting activities', { message: error instanceof Error ? error.message : 'Unknown', requestId });

    res.status(500).json({
      success: false,
      message: 'Error exporting activities',
      error: error instanceof Error ? error.message : 'Unknown error',
      requestId
    });
  }
};

export const revertActivity = async (req: AuthRequest, res: Response) => {
  const startTime = Date.now();
  const requestId = `revert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    const { id } = req.params;
    const user = req.user;

    const activity = await ActivityLog.findById(id);
    if (!activity) {
      return res.status(404).json({ success: false, message: 'Activity not found' });
    }

    if (!activity.reversible) {
      return res.status(400).json({ success: false, message: 'This activity cannot be reverted' });
    }

    if (activity.reverted) {
      return res.status(400).json({ success: false, message: 'Activity already reverted' });
    }

    // Check permissions
    const baseQuery = await getUserActivityQuery(user.id, user.role);
    const canRevert = baseQuery.visibility?.$in?.includes('management');
    
    if (!canRevert && activity.user.toString() !== user.id) {
      return res.status(403).json({ success: false, message: 'Insufficient permissions to revert this activity' });
    }

    // Perform revert based on action type
    let revertSuccess = false;
    let revertMessage = '';

    try {
      switch (activity.action) {
        case 'create':
          if (activity.resourceType === 'project' && activity.resourceId) {
            await Project.findByIdAndDelete(activity.resourceId);
            revertMessage = 'Project deleted';
            revertSuccess = true;
          }
          break;

        case 'update':
          if (activity.changes?.before && activity.resourceId) {
            if (activity.resourceType === 'project') {
              await Project.findByIdAndUpdate(activity.resourceId, activity.changes.before);
              revertMessage = 'Project restored to previous state';
              revertSuccess = true;
            }
          }
          break;

        case 'delete':
          if (activity.changes?.before && activity.resourceType === 'project') {
            await Project.create({ ...activity.changes.before, _id: activity.resourceId });
            revertMessage = 'Project restored';
            revertSuccess = true;
          }
          break;

        default:
          return res.status(400).json({ success: false, message: 'Revert not supported for this action type' });
      }
    } catch (revertError) {
      logger.error('Failed to revert activity', { message: revertError instanceof Error ? revertError.message : 'Unknown', requestId });
      return res.status(500).json({ success: false, message: 'Failed to revert activity', error: revertError instanceof Error ? revertError.message : 'Unknown' });
    }

    if (revertSuccess) {
      activity.reverted = true;
      activity.revertedBy = new mongoose.Types.ObjectId(user.id);
      activity.revertedAt = new Date();
      await activity.save();

      // Log the revert action
      await ActivityLog.create({
        user: user.id,
        userName: user.name,
        action: 'revert',
        resource: activity.resource,
        resourceType: activity.resourceType,
        resourceId: activity.resourceId,
        projectId: activity.projectId,
        projectName: activity.projectName,
        details: `Reverted activity: ${activity.action} ${activity.resource}`,
        status: 'success',
        metadata: { originalActivityId: activity._id, revertMessage },
        visibility: activity.visibility,
        ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
        requestId,
        duration: Date.now() - startTime,
        userAgent: req.headers['user-agent'],
        httpMethod: req.method,
        endpoint: req.originalUrl,
        deviceFingerprint: generateDeviceFingerprint(req as any),
        browserDetails: parseBrowserDetails(req.headers['user-agent'] || ''),
        geolocation: getGeolocation(req.ip || req.socket.remoteAddress || ''),
        referrerUrl: (req.headers['referer'] || req.headers['referrer']) as string
      });

      clearActivityCache();

      res.status(200).json({
        success: true,
        message: revertMessage,
        data: activity
      });
    } else {
      res.status(500).json({ success: false, message: 'Revert operation failed' });
    }
  } catch (error) {
    logger.error('Error reverting activity', { message: error instanceof Error ? error.message : 'Unknown', requestId });

    res.status(500).json({
      success: false,
      message: 'Error reverting activity',
      error: error instanceof Error ? error.message : 'Unknown error',
      requestId
    });
  }
};

export const searchActivities = async (req: AuthRequest, res: Response) => {
  const startTime = Date.now();
  const requestId = `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    const { q, page = 1, limit = 20 } = req.query;
    const user = req.user;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const skip = (Number(page) - 1) * Number(limit);
    const baseQuery = await getUserActivityQuery(user.id, user.role);

    const searchQuery = {
      ...baseQuery,
      $text: { $search: q }
    };

    const [activities, total] = await Promise.all([
      ActivityLog.find(searchQuery, { score: { $meta: 'textScore' } })
        .populate('user', 'name email')
        .populate('projectId', 'name')
        .sort({ score: { $meta: 'textScore' }, timestamp: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      ActivityLog.countDocuments(searchQuery)
    ]);

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
    logger.error('Error searching activities', { message: error instanceof Error ? error.message : 'Unknown', requestId });

    res.status(500).json({
      success: false,
      message: 'Error searching activities',
      error: error instanceof Error ? error.message : 'Unknown error',
      requestId
    });
  }
};


export const verifyActivity = async (req: AuthRequest, res: Response) => {
  const startTime = Date.now();
  const requestId = `verify_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    const { id } = req.params;
    const user = req.user;

    const baseQuery = await getUserActivityQuery(user.id, user.role);
    const isAdmin = baseQuery.visibility?.$in?.includes('management');

    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can verify activity integrity'
      });
    }

    const result = await verifyActivityIntegrity(id);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error verifying activity', { message: error instanceof Error ? error.message : 'Unknown', requestId });

    res.status(500).json({
      success: false,
      message: 'Error verifying activity',
      error: error instanceof Error ? error.message : 'Unknown error',
      requestId
    });
  }
};

export const verifyChain = async (req: AuthRequest, res: Response) => {
  const startTime = Date.now();
  const requestId = `verifyChain_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    const { limit = 100 } = req.query;
    const user = req.user;

    const baseQuery = await getUserActivityQuery(user.id, user.role);
    const isAdmin = baseQuery.visibility?.$in?.includes('management');

    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can verify chain integrity'
      });
    }

    const result = await verifyChainIntegrity(Number(limit));

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error verifying chain integrity', { message: error instanceof Error ? error.message : 'Unknown', requestId });

    res.status(500).json({
      success: false,
      message: 'Error verifying chain integrity',
      error: error instanceof Error ? error.message : 'Unknown error',
      requestId
    });
  }
};
