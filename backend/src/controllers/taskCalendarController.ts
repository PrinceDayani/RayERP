//path: backend/src/controllers/taskCalendarController.ts

import { Request, Response } from 'express';
import Task from '../models/Task';

export const getCalendarView = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, projectId } = req.query;
    
    const filter: any = { isTemplate: false, dueDate: { $exists: true } };
    if (projectId) filter.project = projectId;
    if (startDate || endDate) {
      filter.dueDate = {};
      if (startDate) filter.dueDate.$gte = new Date(startDate as string);
      if (endDate) filter.dueDate.$lte = new Date(endDate as string);
    }
    
    const tasks = await Task.find(filter)
      .populate('project', 'name')
      .populate('assignedTo', 'firstName lastName')
      .sort({ dueDate: 1 });
    
    const events = tasks.map(task => ({
      id: task._id,
      title: task.title,
      start: task.dueDate,
      end: task.dueDate,
      allDay: true,
      status: task.status,
      priority: task.priority,
      project: task.project,
      assignedTo: task.assignedTo
    }));
    
    res.json({ events });
  } catch (error) {
    console.error('Calendar view error:', error);
    res.status(500).json({ message: 'Error fetching calendar view', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const exportICalendar = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.query;
    
    const filter: any = { isTemplate: false, dueDate: { $exists: true } };
    if (projectId) filter.project = projectId;
    
    const tasks = await Task.find(filter)
      .populate('project', 'name')
      .populate('assignedTo', 'firstName lastName');
    
    // Generate iCal format manually
    let icalContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//RayERP//Task Calendar//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:RayERP Tasks',
      'X-WR-TIMEZONE:UTC'
    ];
    
    tasks.forEach(task => {
      const assignedTo = task.assignedTo as any;
      const dueDate = new Date(task.dueDate);
      const dateStr = dueDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      
      icalContent.push(
        'BEGIN:VEVENT',
        `UID:${task._id}@rayerp.com`,
        `DTSTAMP:${dateStr}`,
        `DTSTART:${dateStr}`,
        `DTEND:${dateStr}`,
        `SUMMARY:${task.title.replace(/[\n\r]/g, ' ')}`,
        `DESCRIPTION:${task.description.replace(/[\n\r]/g, '\\n')}`,
        `LOCATION:${(task.project as any)?.name || ''}`,
        `STATUS:${task.status === 'completed' ? 'CONFIRMED' : 'TENTATIVE'}`,
        `PRIORITY:${task.priority === 'critical' ? '1' : task.priority === 'high' ? '3' : task.priority === 'medium' ? '5' : '9'}`,
        assignedTo ? `ORGANIZER:CN=${assignedTo.firstName} ${assignedTo.lastName}` : '',
        'END:VEVENT'
      );
    });
    
    icalContent.push('END:VCALENDAR');
    
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="tasks.ics"');
    res.send(icalContent.filter(Boolean).join('\r\n'));
  } catch (error) {
    console.error('iCal export error:', error);
    res.status(500).json({ message: 'Error exporting calendar', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const getTimelineView = async (req: Request, res: Response) => {
  try {
    const { projectId, startDate, endDate } = req.query;
    
    const filter: any = { isTemplate: false };
    if (projectId) filter.project = projectId;
    
    const tasks = await Task.find(filter)
      .populate('project', 'name')
      .populate('assignedTo', 'firstName lastName')
      .populate('dependencies.taskId', 'title dueDate')
      .sort({ dueDate: 1 });
    
    const timeline = tasks.map(task => {
      const start = task.createdAt;
      const end = task.dueDate || new Date(task.createdAt.getTime() + (task.estimatedHours || 8) * 60 * 60 * 1000);
      
      return {
        id: task._id,
        title: task.title,
        start,
        end,
        progress: task.status === 'completed' ? 100 : 
                 task.status === 'in-progress' ? 50 : 0,
        status: task.status,
        priority: task.priority,
        dependencies: task.dependencies.map(d => (d.taskId as any)._id),
        assignedTo: task.assignedTo
      };
    });
    
    res.json({ timeline });
  } catch (error) {
    console.error('Timeline view error:', error);
    res.status(500).json({ message: 'Error fetching timeline view', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const syncGoogleCalendar = async (req: Request, res: Response) => {
  try {
    const { accessToken, calendarId } = req.body;
    
    if (!accessToken || !calendarId) {
      return res.status(400).json({ message: 'Access token and calendar ID required' });
    }
    
    // This is a placeholder - implement actual Google Calendar API integration
    res.json({ 
      success: true, 
      message: 'Google Calendar sync initiated',
      note: 'Implement Google Calendar API integration with OAuth2'
    });
  } catch (error) {
    console.error('Google Calendar sync error:', error);
    res.status(500).json({ message: 'Error syncing with Google Calendar', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};
