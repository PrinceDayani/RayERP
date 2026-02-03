import { Request, Response } from 'express';
import NotificationSettings from '../models/NotificationSettings';

export const getNotificationSettings = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;

  try {
    let settings = await NotificationSettings.findOne({ user: userId });
    
    if (!settings) {
      settings = await NotificationSettings.create({ user: userId });
    }

    res.json({ success: true, settings });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateNotificationSettings = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;

  try {
    const updates = req.body;
    
    let settings = await NotificationSettings.findOne({ user: userId });
    
    if (!settings) {
      settings = await NotificationSettings.create({ user: userId, ...updates });
    } else {
      Object.assign(settings, updates);
      await settings.save();
    }

    res.json({
      success: true,
      settings,
      message: 'Notification settings updated successfully'
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
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
