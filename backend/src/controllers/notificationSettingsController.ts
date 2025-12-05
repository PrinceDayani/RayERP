import { Request, Response } from 'express';

export const getNotificationSettings = async (req: Request, res: Response) => {
  try {
    const settings = {
      email: {
        enabled: true,
        smtp: {
          host: 'smtp.example.com',
          port: 587,
          secure: false,
          from: 'noreply@rayerp.com'
        }
      },
      inApp: {
        enabled: true,
        retentionDays: 30
      },
      push: {
        enabled: false
      },
      channels: {
        taskAssigned: ['email', 'inApp'],
        projectUpdated: ['inApp'],
        leaveApproved: ['email', 'inApp'],
        invoiceCreated: ['email']
      }
    };

    res.json({ success: true, data: settings });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateNotificationSettings = async (req: Request, res: Response) => {
  try {
    const settings = req.body;

    res.json({
      success: true,
      data: settings,
      message: 'Notification settings updated'
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
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
