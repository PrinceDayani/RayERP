import { Request, Response } from 'express';
import mongoose from 'mongoose';
import ReportingSchedule, { IReportTemplate, TemplateFieldType } from '../models/ReportingSchedule';
import Project from '../models/Project';
import { getAccessibleProjectIdsForUser } from '../middleware/projectAccess.middleware';

const ALLOWED_FIELD_TYPES: TemplateFieldType[] = ['text', 'number', 'select', 'date', 'photo'];
const ALLOWED_ACTIVITY_CATEGORIES = ['construction', 'procurement', 'design', 'inspection', 'administrative', 'other'];

// Validate template payload. Returns the normalized template or an error message.
const validateTemplate = (raw: any): { template: Omit<IReportTemplate, 'version'> | null; error?: string } => {
  if (raw == null) return { template: null };

  if (typeof raw !== 'object') {
    return { template: null, error: 'template must be an object' };
  }

  const sections = Array.isArray(raw.sections) ? raw.sections : [];
  const sectionKeys = new Set<string>();
  for (const s of sections) {
    if (!s || typeof s.key !== 'string' || !s.key.trim() || typeof s.label !== 'string' || !s.label.trim()) {
      return { template: null, error: 'each section requires a non-empty key and label' };
    }
    if (sectionKeys.has(s.key)) {
      return { template: null, error: `duplicate section key: ${s.key}` };
    }
    sectionKeys.add(s.key);
  }

  const customFields = Array.isArray(raw.customFields) ? raw.customFields : [];
  const fieldKeys = new Set<string>();
  for (const f of customFields) {
    if (!f || typeof f.key !== 'string' || !f.key.trim() || typeof f.label !== 'string' || !f.label.trim()) {
      return { template: null, error: 'each custom field requires a non-empty key and label' };
    }
    if (fieldKeys.has(f.key)) {
      return { template: null, error: `duplicate custom field key: ${f.key}` };
    }
    fieldKeys.add(f.key);
    if (!ALLOWED_FIELD_TYPES.includes(f.type)) {
      return { template: null, error: `invalid field type "${f.type}" for ${f.key}` };
    }
    if (f.type === 'select') {
      if (!Array.isArray(f.options) || f.options.length === 0) {
        return { template: null, error: `select field ${f.key} requires non-empty options` };
      }
    }
  }

  const requiredActivityCategories = Array.isArray(raw.requiredActivityCategories) ? raw.requiredActivityCategories : [];
  for (const c of requiredActivityCategories) {
    if (!ALLOWED_ACTIVITY_CATEGORIES.includes(c)) {
      return { template: null, error: `invalid activity category: ${c}` };
    }
  }

  return {
    template: {
      sections: sections.map((s: any) => ({
        key: s.key.trim(),
        label: s.label.trim(),
        required: !!s.required,
        helpText: s.helpText || undefined
      })),
      customFields: customFields.map((f: any) => ({
        key: f.key.trim(),
        label: f.label.trim(),
        type: f.type,
        options: f.type === 'select' ? f.options.map((o: any) => String(o)) : undefined,
        required: !!f.required,
        helpText: f.helpText || undefined
      })),
      requiredActivityCategories,
      requireBlockers: !!raw.requireBlockers,
      requireNextSteps: !!raw.requireNextSteps,
      requireFinancials: !!raw.requireFinancials
    }
  };
};

// Stable JSON snapshot of template structural fields (excluding version) — used to detect changes.
const templateSnapshot = (t: Omit<IReportTemplate, 'version'> | IReportTemplate): string => {
  const norm = {
    sections: (t.sections || []).map(s => ({ key: s.key, label: s.label, required: !!s.required, helpText: s.helpText || '' })),
    customFields: (t.customFields || []).map(f => ({
      key: f.key,
      label: f.label,
      type: f.type,
      options: f.options || [],
      required: !!f.required,
      helpText: f.helpText || ''
    })),
    requiredActivityCategories: (t.requiredActivityCategories || []).slice().sort(),
    requireBlockers: !!t.requireBlockers,
    requireNextSteps: !!t.requireNextSteps,
    requireFinancials: !!t.requireFinancials
  };
  return JSON.stringify(norm);
};

// Create or update reporting schedule for a project
export const upsertReportingSchedule = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { projectId } = req.params;
    const { frequency, dueTime, dueDay, dueDateOfMonth, requiredFrom, reminderEnabled, reminderBeforeMinutes, escalateOnMiss, escalateTo, template } = req.body;

    // Verify project exists and is reporting-based
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const isManager = !!project.managers?.some(m => m.toString() === user._id.toString());
    const isOwner = project.owner.toString() === user._id.toString();
    const userRole = user.role as any;
    const isAdmin = userRole?.level >= 80 || userRole?.name?.toLowerCase() === 'root';

    if (!isManager && !isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Only project managers can configure reporting schedules' });
    }

    // Validate template if provided. `null` means clear the template.
    let templateToPersist: IReportTemplate | undefined = undefined;
    let clearTemplate = false;
    if (template === null) {
      clearTemplate = true;
    } else if (template !== undefined) {
      const { template: validated, error } = validateTemplate(template);
      if (error) {
        return res.status(400).json({ success: false, message: `Invalid template: ${error}` });
      }
      if (validated) {
        // Look up existing schedule to compute version bump.
        const existing = await ReportingSchedule.findOne({ project: projectId }).select('template').lean();
        const prevVersion = existing?.template?.version || 0;
        const structurallyChanged = !existing?.template || templateSnapshot(existing.template) !== templateSnapshot(validated);
        templateToPersist = {
          ...validated,
          version: structurallyChanged ? prevVersion + 1 : prevVersion
        };
      }
    }

    const updateOps: any = {
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

    if (templateToPersist !== undefined) {
      updateOps.template = templateToPersist;
    }

    const mongoOps: any = { $set: updateOps };
    if (clearTemplate) {
      mongoOps.$unset = { template: '' };
    }

    const schedule = await ReportingSchedule.findOneAndUpdate(
      { project: projectId },
      mongoOps,
      { new: true, upsert: true, setDefaultsOnInsert: true }
    )
      .populate('requiredFrom.user', 'name email')
      .populate('escalateTo', 'name email');

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
      .populate('requiredFrom.user', 'name email')
      .populate('escalateTo', 'name email');

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

// ==========================================
// Global schedule handlers (cross-project)
//
// Power /api/reporting/schedules — top-level URLs that address a schedule by
// its own _id. Each handler resolves the schedule's projectId, gates by
// access, then delegates to the project-scoped controller above.
// ==========================================

const gateScheduleOrSend = async (
  scheduleId: string,
  user: any,
  res: Response
): Promise<string | null> => {
  if (!mongoose.isValidObjectId(scheduleId)) {
    res.status(400).json({ success: false, message: 'Invalid schedule id' });
    return null;
  }
  const schedule = await ReportingSchedule.findById(scheduleId).select('project').lean();
  if (!schedule) {
    res.status(404).json({ success: false, message: 'Reporting schedule not found' });
    return null;
  }
  const projectIdStr = schedule.project.toString();
  const access = await getAccessibleProjectIdsForUser(user);
  if (!access.all) {
    const allowed = access.ids.some(id => id.toString() === projectIdStr);
    if (!allowed) {
      res.status(403).json({ success: false, message: 'Access denied' });
      return null;
    }
  }
  return projectIdStr;
};

export const listSchedulesGlobal = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ success: false, message: 'Authentication required' });

    const access = await getAccessibleProjectIdsForUser(user);
    const filter: any = {};
    if (!access.all) {
      if (access.ids.length === 0) return res.json({ success: true, data: [] });
      filter.project = { $in: access.ids };
    }

    const schedules = await ReportingSchedule.find(filter)
      .populate('project', 'name status')
      .populate('requiredFrom.user', 'name email')
      .populate('escalateTo', 'name email')
      .sort({ updatedAt: -1 })
      .lean();

    res.json({ success: true, data: schedules });
  } catch (error: any) {
    console.error('List schedules (global) error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getScheduleByIdGlobal = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ success: false, message: 'Authentication required' });

    const projectId = await gateScheduleOrSend(req.params.scheduleId, user, res);
    if (!projectId) return;

    const schedule = await ReportingSchedule.findById(req.params.scheduleId)
      .populate('project', 'name status')
      .populate('requiredFrom.user', 'name email')
      .populate('escalateTo', 'name email');

    res.json({ success: true, data: schedule });
  } catch (error: any) {
    console.error('Get schedule by id (global) error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateScheduleGlobal = async (req: Request, res: Response) => {
  const user = req.user;
  if (!user) return res.status(401).json({ success: false, message: 'Authentication required' });

  const projectId = await gateScheduleOrSend(req.params.scheduleId, user, res);
  if (!projectId) return;

  req.params.projectId = projectId;
  return upsertReportingSchedule(req, res);
};

export const deactivateScheduleGlobal = async (req: Request, res: Response) => {
  const user = req.user;
  if (!user) return res.status(401).json({ success: false, message: 'Authentication required' });

  const projectId = await gateScheduleOrSend(req.params.scheduleId, user, res);
  if (!projectId) return;

  req.params.projectId = projectId;
  return deactivateReportingSchedule(req, res);
};
