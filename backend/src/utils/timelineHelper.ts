import Timeline from '../models/Timeline';
import mongoose from 'mongoose';

export const createTimelineEvent = async (
  entityType: 'project' | 'task',
  entityId: string,
  eventType: 'created' | 'updated' | 'status_changed' | 'assigned' | 'completed' | 'deleted' | 'comment_added',
  title: string,
  description: string,
  userId: string,
  metadata?: {
    oldValue?: any;
    newValue?: any;
    field?: string;
  }
) => {
  try {
    // Validate required parameters
    if (!entityType || !entityId || !eventType || !title || !description || !userId) {
      throw new Error('Missing required parameters for timeline event');
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(entityId)) {
      throw new Error(`Invalid entityId format: ${entityId}`);
    }
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error(`Invalid userId format: ${userId}`);
    }

    const timelineEvent = new Timeline({
      entityType,
      entityId: new mongoose.Types.ObjectId(entityId),
      eventType,
      title,
      description,
      user: new mongoose.Types.ObjectId(userId),
      metadata
    });

    await timelineEvent.save();
    return timelineEvent;
  } catch (error) {
    console.error('Error creating timeline event:', error);
    throw error; // Re-throw to let caller handle
  }
};

export const getEntityTimeline = async (entityType: 'project' | 'task', entityId: string) => {
  try {
    // Validate parameters
    if (!entityType || !entityId) {
      throw new Error('Missing required parameters for timeline fetch');
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(entityId)) {
      throw new Error(`Invalid entityId format: ${entityId}`);
    }

    const timeline = await Timeline.find({
      entityType,
      entityId: new mongoose.Types.ObjectId(entityId)
    })
    .populate('user', 'firstName lastName')
    .sort({ createdAt: -1 });

    return timeline;
  } catch (error) {
    console.error('Error fetching timeline:', error);
    throw error; // Re-throw to let caller handle
  }
};