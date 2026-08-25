import { Request, Response } from 'express';
import NotificationSettings from '../models/NotificationSettings';
import { logger } from '../utils/logger';

// Every toggle the client may set. Anything else in the body is ignored so a
// caller cannot reach `user` or other document fields through this endpoint.
const NOTIFICATION_FLAGS = [
  'emailNotifications',
  'pushNotifications',
  'soundEnabled',
  'orderNotifications',
  'inventoryAlerts',
  'projectUpdates',
  'taskReminders',
  'budgetAlerts',
  'dailyReports',
  'weeklyReports',
  'monthlyReports',
  'systemAlerts',
  'securityAlerts',
  'maintenanceNotices'
] as const;

export const getNotificationSettings = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;

  try {
    // Upsert rather than find-then-create: `user` is unique, so concurrent
    // first loads would otherwise race into a duplicate-key error.
    const settings = await NotificationSettings.findOneAndUpdate(
      { user: userId },
      { $setOnInsert: { user: userId } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.json({ success: true, settings });
  } catch (error: any) {
    logger.error(`Get notification settings error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Error retrieving notification settings' });
  }
};

export const updateNotificationSettings = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;

  try {
    const updates: Record<string, boolean> = {};

    for (const flag of NOTIFICATION_FLAGS) {
      if (req.body[flag] === undefined) continue;

      if (typeof req.body[flag] !== 'boolean') {
        return res.status(400).json({ success: false, message: `${flag} must be a boolean` });
      }

      updates[flag] = req.body[flag];
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: 'No recognised notification settings supplied' });
    }

    const settings = await NotificationSettings.findOneAndUpdate(
      { user: userId },
      { $set: updates, $setOnInsert: { user: userId } },
      { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
    );

    res.json({
      success: true,
      settings,
      message: 'Notification settings updated successfully'
    });
  } catch (error: any) {
    logger.error(`Update notification settings error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Error saving notification settings' });
  }
};

export const getNotificationTemplates = async (req: Request, res: Response) => {
  try {
    const templates = [
      {
        id: '1',
        name: 'Task Assigned',
        subject: 'New Task Assigned: {{taskName}}',
        body: 'You have been assigned a new task: {{taskName}}',
        variables: ['taskName', 'assignedBy', 'dueDate']
      },
      {
        id: '2',
        name: 'Leave Approved',
        subject: 'Leave Request Approved',
        body: 'Your leave request from {{startDate}} to {{endDate}} has been approved',
        variables: ['startDate', 'endDate', 'approvedBy']
      }
    ];

    res.json({ success: true, data: templates });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateNotificationTemplate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const template = req.body;

    res.json({
      success: true,
      data: { id, ...template },
      message: 'Template updated'
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
