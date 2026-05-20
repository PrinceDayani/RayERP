import { Request, Response } from 'express';
import ReportingSchedule from '../models/ReportingSchedule';
import Project from '../models/Project';
import Employee from '../models/Employee';

// Create or update reporting schedule for a project
export const upsertReportingSchedule = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { projectId } = req.params;
    const { frequency, dueTime, dueDay, dueDateOfMonth, requiredFrom, reminderEnabled, reminderBeforeMinutes, escalateOnMiss, escalateTo } = req.body;

    // Verify project exists and is reporting-based
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Verify user is a manager or owner
    const employee = await Employee.findOne({ user: user._id });
    const isManager = employee && project.managers.some(m => m.toString() === employee._id.toString());
    const isOwner = project.owner.toString() === user._id.toString();
    const userRole = user.role as any;
    const isAdmin = userRole?.level >= 80;

    if (!isManager && !isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Only project managers can configure reporting schedules' });
    }

    const scheduleData = {
      project: projectId,
      frequency: frequency || 'daily',
      dueTime: dueTime || '18:00',
      dueDay,
      dueDateOfMonth,
      requiredFrom: requiredFrom || [],
      reminderEnabled: reminderEnabled !== false,
      reminderBeforeMinutes: reminderBeforeMinutes || 60,
      escalateOnMiss: escalateOnMiss || false,
      escalateTo,
      isActive: true,
      createdBy: user._id
    };

    const schedule = await ReportingSchedule.findOneAndUpdate(
      { project: projectId },
      scheduleData,
      { new: true, upsert: true, setDefaultsOnInsert: true }
    )
      .populate('requiredFrom.employee', 'firstName lastName')
      .populate('escalateTo', 'firstName lastName');

    res.json({ success: true, data: schedule });
  } catch (error: any) {
    console.error('Upsert reporting schedule error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get reporting schedule for a project
export const getReportingSchedule = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;

    const schedule = await ReportingSchedule.findOne({ project: projectId })
      .populate('requiredFrom.employee', 'firstName lastName')
      .populate('escalateTo', 'firstName lastName');

    if (!schedule) {
      return res.json({ success: true, data: null, message: 'No reporting schedule configured' });
    }

    res.json({ success: true, data: schedule });
  } catch (error: any) {
    console.error('Get reporting schedule error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Deactivate reporting schedule
export const deactivateReportingSchedule = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { projectId } = req.params;

    const schedule = await ReportingSchedule.findOneAndUpdate(
      { project: projectId },
      { isActive: false },
      { new: true }
    );

    if (!schedule) {
      return res.status(404).json({ success: false, message: 'No reporting schedule found' });
    }

    res.json({ success: true, data: schedule, message: 'Reporting schedule deactivated' });
  } catch (error: any) {
    console.error('Deactivate reporting schedule error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
