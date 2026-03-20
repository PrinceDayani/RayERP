import crypto from 'crypto';
import ActivityLog, { IActivityLog } from '../models/ActivityLog';

export const calculateHash = (activity: Partial<IActivityLog>, previousHash: string = ''): string => {
  const data = {
    timestamp: activity.timestamp,
    user: activity.user,
    action: activity.action,
    resource: activity.resource,
    resourceType: activity.resourceType,
    resourceId: activity.resourceId,
    details: activity.details,
    status: activity.status,
    previousHash
  };

  return crypto
    .createHash('sha256')
    .update(JSON.stringify(data))
    .digest('hex');
};

export const addHashToActivity = async (activity: IActivityLog): Promise<void> => {
  try {
    const lastActivity = await ActivityLog.findOne()
      .sort({ timestamp: -1, _id: -1 })
      .select('hash')
      .lean();

    const previousHash = lastActivity?.hash || '0';
    activity.hash = calculateHash(activity, previousHash);
    activity.previousHash = previousHash;
  } catch (error) {
    console.error('[Hash Chain] Error adding hash:', error);
    activity.hash = calculateHash(activity, '0');
    activity.previousHash = '0';
  }
};

export const verifyActivityIntegrity = async (activityId: string): Promise<{
  valid: boolean;
  message: string;
}> => {
  try {
    const activity = await ActivityLog.findById(activityId).lean();
    
    if (!activity) {
      return { valid: false, message: 'Activity not found' };
    }

    if (!activity.hash) {
      return { valid: false, message: 'Activity has no hash (created before integrity system)' };
    }

    const calculatedHash = calculateHash(activity, activity.previousHash || '0');
    
    if (calculatedHash !== activity.hash) {
      return { 
        valid: false, 
        message: 'Hash mismatch - activity may have been tampered with' 
      };
    }

    return { valid: true, message: 'Activity integrity verified' };
  } catch (error) {
    return { 
      valid: false, 
      message: `Verification error: ${error instanceof Error ? error.message : 'Unknown'}` 
    };
  }
};

export const verifyChainIntegrity = async (limit: number = 100): Promise<{
  valid: boolean;
  totalChecked: number;
  invalidActivities: string[];
  message: string;
}> => {
  try {
    const activities = await ActivityLog.find({ hash: { $exists: true } })
      .sort({ timestamp: 1, _id: 1 })
      .limit(limit)
      .lean();

    if (activities.length === 0) {
      return {
        valid: true,
        totalChecked: 0,
        invalidActivities: [],
        message: 'No activities with hash found'
      };
    }

    const invalidActivities: string[] = [];
    let previousHash = '0';

    for (const activity of activities) {
      if (activity.previousHash !== previousHash) {
        invalidActivities.push(activity._id.toString());
      }

      const calculatedHash = calculateHash(activity, activity.previousHash || '0');
      if (calculatedHash !== activity.hash) {
        invalidActivities.push(activity._id.toString());
      }

      previousHash = activity.hash || '0';
    }

    return {
      valid: invalidActivities.length === 0,
      totalChecked: activities.length,
      invalidActivities,
      message: invalidActivities.length === 0 
        ? `Chain integrity verified for ${activities.length} activities`
        : `Found ${invalidActivities.length} invalid activities`
    };
  } catch (error) {
    return {
      valid: false,
      totalChecked: 0,
      invalidActivities: [],
      message: `Verification error: ${error instanceof Error ? error.message : 'Unknown'}`
    };
  }
};
