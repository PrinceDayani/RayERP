import { Request, Response } from 'express';
import Notification from '../models/Notification';
import { NotificationEmitter } from '../utils/notificationEmitter';
import { logger } from '../utils/logger';

export const getUserNotifications = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    const { page = 1, limit = 50, read, type } = req.query;

    const query: any = { userId };
    if (read !== undefined) query.read = read === 'true';
    if (type) query.type = type;

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({ userId, read: false });

    res.json({
      success: true,
      data: notifications,
      unreadCount,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    logger.error('Error fetching notifications:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  }
};

export const markAsRead = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    const { id } = req.params;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId },
      { read: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.json({ success: true, data: notification });
  } catch (error) {
    logger.error('Error marking notification as read:', error);
    res.status(500).json({ success: false, message: 'Failed to mark as read' });
  }
};

export const markAllAsRead = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;

    await Notification.updateMany(
      { userId, read: false },
      { read: true, readAt: new Date() }
    );

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    logger.error('Error marking all as read:', error);
    res.status(500).json({ success: false, message: 'Failed to mark all as read' });
  }
};

export const deleteNotification = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    const { id } = req.params;

    const notification = await Notification.findOneAndDelete({ _id: id, userId });

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    logger.error('Error deleting notification:', error);
    res.status(500).json({ success: false, message: 'Failed to delete notification' });
  }
};

export const deleteAllNotifications = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;

    await Notification.deleteMany({ userId });

    res.json({ success: true, message: 'All notifications deleted' });
  } catch (error) {
    logger.error('Error deleting all notifications:', error);
    res.status(500).json({ success: false, message: 'Failed to delete all notifications' });
  }
};

export const sendTestNotification = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;

    await NotificationEmitter.sendToUser(userId.toString(), {
      type: 'info',
      title: 'Test Notification',
      message: 'This is a test notification. Your real-time system is working perfectly!',
      priority: 'low'
    });

    res.json({ success: true, message: 'Test notification sent' });
  } catch (error) {
    logger.error('Error sending test notification:', error);
    res.status(500).json({ success: false, message: 'Failed to send test notification' });
  }
};

export const getUnreadCount = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    const count = await Notification.countDocuments({ userId, read: false });

    res.json({ success: true, count });
  } catch (error) {
    logger.error('Error getting unread count:', error);
    res.status(500).json({ success: false, message: 'Failed to get unread count' });
  }
};
