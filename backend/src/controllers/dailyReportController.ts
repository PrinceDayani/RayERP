import { Request, Response } from 'express';
import mongoose from 'mongoose';
import DailyReport from '../models/DailyReport';
import Project from '../models/Project';
import ReportingSchedule, { IReportTemplate } from '../models/ReportingSchedule';
import { getAccessibleProjectIdsForUser } from '../middleware/projectAccess.middleware';

// Validate a report payload against the project's report template (if one exists).
// Returns the templateVersion to snapshot, the normalized customFieldValues, or an error message.
const validateReportAgainstTemplate = async (
  projectId: string,
  body: any
): Promise<{
  templateVersion?: number;
  customFieldValues?: Map<string, any>;
  error?: string;
}> => {
  const schedule = await ReportingSchedule.findOne({ project: projectId }).select('template').lean();
  const template = schedule?.template as IReportTemplate | undefined;

  if (!template || (!template.customFields?.length && !template.requiredActivityCategories?.length
    && !template.requireBlockers && !template.requireNextSteps && !template.requireFinancials)) {
    // No template, or template has no constraints — allow freeform.
    return {};
  }

  const activities = Array.isArray(body.activities) ? body.activities : [];
  const blockers = Array.isArray(body.blockers) ? body.blockers : [];
  const nextSteps = Array.isArray(body.nextSteps) ? body.nextSteps.filter((s: any) => String(s).trim()) : [];
  const financials = body.financials;

  if (template.requireBlockers && blockers.length === 0) {
    return { error: 'Template requires at least one blocker entry' };
  }
  if (template.requireNextSteps && nextSteps.length === 0) {
    return { error: 'Template requires at least one next step' };
  }
  if (template.requireFinancials && (!financials ||
    (!financials.paymentsProcessed && !financials.invoicesReceived))) {
    return { error: 'Template requires financial activity to be reported' };
  }

  if (template.requiredActivityCategories?.length) {
    const present = new Set(activities.map((a: any) => a.category).filter(Boolean));
    const missing = template.requiredActivityCategories.filter(c => !present.has(c));
    if (missing.length > 0) {
      return { error: `Template requires activities in these categories: ${missing.join(', ')}` };
    }
  }

  const incomingValues = (body.customFieldValues && typeof body.customFieldValues === 'object')
    ? body.customFieldValues
    : {};

  const normalized = new Map<string, any>();
  for (const field of template.customFields || []) {
    const raw = incomingValues[field.key];
    const isEmpty = raw === undefined || raw === null || raw === '';

    if (field.required && isEmpty) {
      return { error: `Field "${field.label}" is required` };
    }
    if (isEmpty) continue;

    switch (field.type) {
      case 'text':
      case 'photo':
        normalized.set(field.key, String(raw));
        break;
      case 'number': {
        const n = Number(raw);
        if (!Number.isFinite(n)) {
          return { error: `Field "${field.label}" must be a number` };
        }
        normalized.set(field.key, n);
        break;
      }
      case 'select': {
        const v = String(raw);
        if (!field.options || !field.options.includes(v)) {
          return { error: `Field "${field.label}" must be one of: ${(field.options || []).join(', ')}` };
        }
        normalized.set(field.key, v);
        break;
      }
      case 'date': {
        const d = new Date(String(raw));
        if (isNaN(d.getTime())) {
          return { error: `Field "${field.label}" must be a valid date` };
        }
        normalized.set(field.key, d.toISOString());
        break;
      }
    }
  }

  return {
    templateVersion: template.version || 0,
    customFieldValues: normalized
  };
};

// Create/Submit a daily report
export const createDailyReport = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { projectId } = req.params;
    const { reportDate, reportType, activities, financials, blockers, nextSteps, notes, status } = req.body;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Duplicate check (same user, same project, same day)
    const reportDateObj = new Date(reportDate);
    const startOfDay = new Date(reportDateObj.setHours(0, 0, 0, 0));
    const endOfDay = new Date(reportDateObj.setHours(23, 59, 59, 999));

    const existingReport = await DailyReport.findOne({
      reportedBy: user._id,
      project: projectId,
      reportDate: { $gte: startOfDay, $lte: endOfDay }
    });

    if (existingReport) {
      return res.status(409).json({
        success: false,
        message: 'A report already exists for this date. Use update instead.',
        existingReportId: existingReport._id
      });
    }

    const templateCheck = await validateReportAgainstTemplate(projectId, req.body);
    if (templateCheck.error) {
      return res.status(400).json({ success: false, message: templateCheck.error });
    }

    const report = new DailyReport({
      reportedBy: user._id,
      project: projectId,
      reportDate: new Date(reportDate),
      reportType: reportType || 'daily',
      activities: activities || [],
      financials: financials || undefined,
      blockers: blockers || [],
      nextSteps: nextSteps || [],
      notes,
      status: status || 'submitted',
      customFieldValues: templateCheck.customFieldValues,
      templateVersion: templateCheck.templateVersion
    });

    await report.save();

    const populatedReport = await DailyReport.findById(report._id)
      .populate('reportedBy', 'name email')
      .populate('project', 'name');

    res.status(201).json({ success: true, data: populatedReport });
  } catch (error: any) {
    console.error('Create daily report error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all reports for a project
export const getProjectReports = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { projectId } = req.params;
    const { startDate, endDate, status, reportedBy, reportType, page = 1, limit = 20 } = req.query;

    const filter: any = { project: projectId };

    if (startDate && endDate) {
      filter.reportDate = { $gte: new Date(startDate as string), $lte: new Date(endDate as string) };
    } else if (startDate) {
      filter.reportDate = { $gte: new Date(startDate as string) };
    } else if (endDate) {
      filter.reportDate = { $lte: new Date(endDate as string) };
    }

    if (status) filter.status = status;
    if (reportedBy) filter.reportedBy = reportedBy;
    if (reportType) filter.reportType = reportType;

    const skip = (Number(page) - 1) * Number(limit);

    const [reports, total] = await Promise.all([
      DailyReport.find(filter)
        .populate('reportedBy', 'name email')
        .populate('acknowledgedBy', 'name email')
        .sort({ reportDate: -1 })
        .skip(skip)
        .limit(Number(limit)),
      DailyReport.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: reports,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error: any) {
    console.error('Get project reports error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get my reports for a project
export const getMyReports = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { projectId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const filter = { project: projectId, reportedBy: user._id };
    const skip = (Number(page) - 1) * Number(limit);

    const [reports, total] = await Promise.all([
      DailyReport.find(filter)
        .populate('acknowledgedBy', 'name email')
        .sort({ reportDate: -1 })
        .skip(skip)
        .limit(Number(limit)),
      DailyReport.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: reports,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error: any) {
    console.error('Get my reports error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get a single report by ID
export const getReportById = async (req: Request, res: Response) => {
  try {
    const { projectId, reportId } = req.params;

    const report = await DailyReport.findOne({ _id: reportId, project: projectId })
      .populate('reportedBy', 'name email')
      .populate('acknowledgedBy', 'name email')
      .populate('blockers.resolvedBy', 'name email');

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    res.json({ success: true, data: report });
  } catch (error: any) {
    console.error('Get report by ID error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update a report (only own + not acknowledged)
export const updateDailyReport = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { projectId, reportId } = req.params;
    const updates = req.body;

    const report = await DailyReport.findOne({ _id: reportId, project: projectId });
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    if (report.reportedBy.toString() !== user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You can only edit your own reports' });
    }

    if (report.status === 'acknowledged') {
      return res.status(400).json({ success: false, message: 'Cannot edit an acknowledged report' });
    }

    const allowedFields = ['activities', 'financials', 'blockers', 'nextSteps', 'notes', 'status', 'reportType'];
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        (report as any)[field] = updates[field];
      }
    }

    // Re-validate against the template using the merged payload (existing + updates).
    const mergedForValidation = {
      activities: report.activities,
      blockers: report.blockers,
      nextSteps: report.nextSteps,
      financials: report.financials,
      customFieldValues: updates.customFieldValues ?? Object.fromEntries(report.customFieldValues || new Map())
    };
    const templateCheck = await validateReportAgainstTemplate(projectId, mergedForValidation);
    if (templateCheck.error) {
      return res.status(400).json({ success: false, message: templateCheck.error });
    }
    if (templateCheck.customFieldValues !== undefined) {
      report.customFieldValues = templateCheck.customFieldValues;
    }
    if (templateCheck.templateVersion !== undefined) {
      report.templateVersion = templateCheck.templateVersion;
    }

    await report.save();

    const populatedReport = await DailyReport.findById(report._id)
      .populate('reportedBy', 'name email')
      .populate('acknowledgedBy', 'name email');

    res.json({ success: true, data: populatedReport });
  } catch (error: any) {
    console.error('Update daily report error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Acknowledge a report (manager action)
export const acknowledgeReport = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { projectId, reportId } = req.params;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const isManager = !!project.managers?.some(m => m.toString() === user._id.toString());
    const isOwner = project.owner.toString() === user._id.toString();
    const userRole = user.role as any;
    const isAdmin = userRole?.level >= 80 || userRole?.name?.toLowerCase() === 'root';

    if (!isManager && !isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Only project managers can acknowledge reports' });
    }

    const report = await DailyReport.findOneAndUpdate(
      { _id: reportId, project: projectId, status: 'submitted' },
      {
        status: 'acknowledged',
        acknowledgedBy: user._id,
        acknowledgedAt: new Date()
      },
      { new: true }
    )
      .populate('reportedBy', 'name email')
      .populate('acknowledgedBy', 'name email');

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found or already acknowledged' });
    }

    res.json({ success: true, data: report });
  } catch (error: any) {
    console.error('Acknowledge report error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete a report (only drafts by the author)
export const deleteDailyReport = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { projectId, reportId } = req.params;

    const report = await DailyReport.findOne({ _id: reportId, project: projectId });
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    if (report.reportedBy.toString() !== user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You can only delete your own reports' });
    }

    if (report.status !== 'draft') {
      return res.status(400).json({ success: false, message: 'Only draft reports can be deleted' });
    }

    await DailyReport.findByIdAndDelete(reportId);
    res.json({ success: true, message: 'Report deleted successfully' });
  } catch (error: any) {
    console.error('Delete daily report error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get reporting status (compliance — who reported, who didn't)
export const getReportingStatus = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { date } = req.query;

    const targetDate = date ? new Date(date as string) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const project = await Project.findById(projectId)
      .populate('team', 'name email')
      .populate('managers', 'name email');

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const reports = await DailyReport.find({
      project: projectId,
      reportDate: { $gte: startOfDay, $lte: endOfDay }
    }).populate('reportedBy', 'name email');

    const reportedUserIds = new Set(
      reports.map(r => (r.reportedBy as any)?._id?.toString()).filter(Boolean)
    );

    const members = [...(project.team || []), ...(project.managers || [])];
    const compliance = members.map((member: any) => {
      const memberId = member._id?.toString();
      return {
        user: { _id: member._id, name: member.name, email: member.email },
        hasReported: memberId ? reportedUserIds.has(memberId) : false,
        report:
          reports.find(r => (r.reportedBy as any)?._id?.toString() === memberId) || null
      };
    });

    const reported = compliance.filter(c => c.hasReported).length;
    const pending = compliance.filter(c => !c.hasReported).length;

    res.json({
      success: true,
      data: {
        date: targetDate,
        totalMembers: compliance.length,
        reported,
        pending,
        complianceRate: compliance.length > 0 ? Math.round((reported / compliance.length) * 100) : 0,
        members: compliance
      }
    });
  } catch (error: any) {
    console.error('Get reporting status error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Resolve a blocker (manager action)
export const resolveBlocker = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { projectId, reportId, blockerId } = req.params;

    const report = await DailyReport.findOne({ _id: reportId, project: projectId });
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    const blocker = (report.blockers as any).id(blockerId);
    if (!blocker) {
      return res.status(404).json({ success: false, message: 'Blocker not found' });
    }

    blocker.isResolved = true;
    blocker.resolvedAt = new Date();
    blocker.resolvedBy = user._id;

    await report.save();

    const populatedReport = await DailyReport.findById(report._id)
      .populate('reportedBy', 'name email')
      .populate('blockers.resolvedBy', 'name email');

    res.json({ success: true, data: populatedReport });
  } catch (error: any) {
    console.error('Resolve blocker error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all unresolved blockers for a project
export const getUnresolvedBlockers = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;

    const reports = await DailyReport.find({
      project: projectId,
      'blockers.isResolved': false
    })
      .populate('reportedBy', 'name email')
      .populate('blockers.resolvedBy', 'name email')
      .sort({ reportDate: -1 });

    const blockers = reports.flatMap(report =>
      report.blockers
        .filter(b => !b.isResolved)
        .map(b => ({
          _id: (b as any)._id,
          description: b.description,
          severity: b.severity,
          reportId: report._id,
          reportDate: report.reportDate,
          reportedBy: report.reportedBy
        }))
    );

    res.json({ success: true, data: blockers });
  } catch (error: any) {
    console.error('Get unresolved blockers error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// Cross-project reporting (org-wide dashboard)
// ==========================================

const toObjectIdArray = (input: any): mongoose.Types.ObjectId[] => {
  if (!input) return [];
  const arr = Array.isArray(input) ? input : String(input).split(',');
  const out: mongoose.Types.ObjectId[] = [];
  for (const raw of arr) {
    const s = String(raw).trim();
    if (mongoose.isValidObjectId(s)) out.push(new mongoose.Types.ObjectId(s));
  }
  return out;
};

const scopeProjectsByAccess = (
  accessible: { all: boolean; ids: mongoose.Types.ObjectId[] },
  requestedIds: mongoose.Types.ObjectId[]
): mongoose.Types.ObjectId[] | 'ALL' => {
  if (accessible.all) {
    return requestedIds.length > 0 ? requestedIds : 'ALL';
  }
  if (requestedIds.length === 0) return accessible.ids;
  const accessibleSet = new Set(accessible.ids.map(id => id.toString()));
  return requestedIds.filter(id => accessibleSet.has(id.toString()));
};

// GET /api/reporting/feed
export const getReportsFeed = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const accessible = await getAccessibleProjectIdsForUser(user as any);
    const requestedProjects = toObjectIdArray(req.query.projectIds);
    const scopedProjects = scopeProjectsByAccess(accessible, requestedProjects);

    if (scopedProjects !== 'ALL' && scopedProjects.length === 0) {
      return res.json({
        success: true,
        data: [],
        pagination: { total: 0, page: 1, limit: 0, pages: 0 }
      });
    }

    const filter: any = {};
    if (scopedProjects !== 'ALL') {
      filter.project = { $in: scopedProjects };
    }

    const userIds = toObjectIdArray(req.query.userIds);
    if (userIds.length > 0) filter.reportedBy = { $in: userIds };

    if (req.query.status) {
      const status = String(req.query.status);
      if (['draft', 'submitted', 'acknowledged'].includes(status)) {
        filter.status = status;
      }
    }

    if (req.query.from || req.query.to) {
      filter.reportDate = {};
      if (req.query.from) filter.reportDate.$gte = new Date(String(req.query.from));
      if (req.query.to) filter.reportDate.$lte = new Date(String(req.query.to));
    }

    if (req.query.hasBlockers === 'true') {
      filter['blockers.0'] = { $exists: true };
    }

    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '20'), 10) || 20));
    const skip = (page - 1) * limit;

    const [reports, total] = await Promise.all([
      DailyReport.find(filter)
        .populate('reportedBy', 'name email')
        .populate('project', 'name')
        .sort({ reportDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      DailyReport.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: reports,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    console.error('Get reports feed error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/reporting/matrix
export const getReportsMatrix = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const accessible = await getAccessibleProjectIdsForUser(user as any);
    const requestedProjects = toObjectIdArray(req.query.projectIds);
    const scopedProjects = scopeProjectsByAccess(accessible, requestedProjects);

    const to = req.query.to ? new Date(String(req.query.to)) : new Date();
    const from = req.query.from
      ? new Date(String(req.query.from))
      : new Date(to.getTime() - 13 * 24 * 60 * 60 * 1000);

    const msPerDay = 24 * 60 * 60 * 1000;
    const rangeDays = Math.max(1, Math.ceil((to.getTime() - from.getTime()) / msPerDay) + 1);
    if (rangeDays > 14) {
      return res.status(400).json({ success: false, message: 'Matrix date range capped at 14 days' });
    }

    const projectFilter: any = {};
    if (scopedProjects !== 'ALL') {
      if (scopedProjects.length === 0) {
        return res.json({ success: true, data: { members: [], projects: [], cells: {}, range: { from, to } } });
      }
      projectFilter._id = { $in: scopedProjects };
    }

    const projects = await Project.find(projectFilter)
      .select('_id name team managers owner')
      .limit(20)
      .lean();

    const projectIds = projects.map(p => p._id);

    const reports = await DailyReport.find({
      project: { $in: projectIds },
      reportDate: { $gte: from, $lte: to }
    })
      .populate('reportedBy', 'name email')
      .select('reportedBy project reportDate totalHours status')
      .lean();

    const memberMap = new Map<string, { _id: string; name: string; email?: string }>();
    for (const r of reports) {
      const u = r.reportedBy as any;
      if (u && u._id) {
        memberMap.set(u._id.toString(), { _id: u._id.toString(), name: u.name, email: u.email });
      }
    }

    const members = Array.from(memberMap.values()).slice(0, 50);
    const memberIdSet = new Set(members.map(m => m._id));

    const cells: Record<string, { hasReported: boolean; hours: number; status: string }> = {};
    for (const r of reports) {
      const u = r.reportedBy as any;
      if (!u || !memberIdSet.has(u._id.toString())) continue;
      const d = new Date(r.reportDate);
      const dateKey = d.toISOString().slice(0, 10);
      const key = `${u._id.toString()}__${r.project.toString()}__${dateKey}`;
      cells[key] = {
        hasReported: true,
        hours: r.totalHours || 0,
        status: r.status
      };
    }

    res.json({
      success: true,
      data: {
        members,
        projects: projects.map(p => ({ _id: p._id.toString(), name: p.name })),
        cells,
        range: { from, to, days: rangeDays }
      }
    });
  } catch (error: any) {
    console.error('Get reports matrix error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/reporting/summary
export const getReportsFeedSummary = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const accessible = await getAccessibleProjectIdsForUser(user as any);
    const projectFilter = accessible.all ? {} : { project: { $in: accessible.ids } };

    if (!accessible.all && accessible.ids.length === 0) {
      return res.json({
        success: true,
        data: {
          reportsToday: 0,
          pendingAcknowledgments: 0,
          openBlockers: 0,
          complianceLast7d: 0
        }
      });
    }

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const sevenDaysAgo = new Date(startOfToday.getTime() - 6 * 24 * 60 * 60 * 1000);

    const [reportsToday, pendingAcknowledgments, blockerAgg, schedules, reportsLast7d] = await Promise.all([
      DailyReport.countDocuments({
        ...projectFilter,
        reportDate: { $gte: startOfToday, $lte: endOfToday }
      }),
      DailyReport.countDocuments({ ...projectFilter, status: 'submitted' }),
      DailyReport.aggregate([
        { $match: { ...projectFilter, 'blockers.0': { $exists: true } } },
        { $unwind: '$blockers' },
        { $match: { 'blockers.isResolved': false } },
        { $count: 'open' }
      ]),
      ReportingSchedule.find({
        ...(accessible.all ? {} : { project: { $in: accessible.ids } }),
        isActive: true
      })
        .select('project frequency requiredFrom')
        .lean(),
      DailyReport.countDocuments({
        ...projectFilter,
        reportDate: { $gte: sevenDaysAgo, $lte: endOfToday }
      })
    ]);

    const openBlockers = blockerAgg[0]?.open || 0;

    let expectedLast7d = 0;
    for (const sched of schedules) {
      const reporters = sched.requiredFrom?.length || 0;
      if (reporters === 0) continue;
      if (sched.frequency === 'daily') expectedLast7d += reporters * 7;
      else if (sched.frequency === 'weekly') expectedLast7d += reporters * 1;
      else if (sched.frequency === 'bi-weekly') expectedLast7d += Math.ceil(reporters * 0.5);
      else if (sched.frequency === 'monthly') expectedLast7d += Math.ceil(reporters * (7 / 30));
    }

    const complianceLast7d = expectedLast7d > 0
      ? Math.min(100, Math.round((reportsLast7d / expectedLast7d) * 100))
      : 0;

    res.json({
      success: true,
      data: {
        reportsToday,
        pendingAcknowledgments,
        openBlockers,
        complianceLast7d
      }
    });
  } catch (error: any) {
    console.error('Get reports feed summary error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// Global single-report handlers (cross-project)
//
// These power /api/reporting/reports/:reportId — top-level URLs that don't
// know the projectId. Each one verifies the user has access to the report's
// parent project, then injects projectId into req.params and delegates to
// the existing project-scoped handler. Keeps business logic in one place.
// ==========================================

// Returns the report's projectId if the user can access it.
// On any failure, writes the error response and returns null.
const gateReportOrSend = async (
  reportId: string,
  user: any,
  res: Response
): Promise<string | null> => {
  if (!mongoose.isValidObjectId(reportId)) {
    res.status(400).json({ success: false, message: 'Invalid report id' });
    return null;
  }
  const report = await DailyReport.findById(reportId).select('project').lean();
  if (!report) {
    res.status(404).json({ success: false, message: 'Report not found' });
    return null;
  }
  const projectIdStr = report.project.toString();
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

export const getReportByIdGlobal = async (req: Request, res: Response) => {
  const user = req.user;
  if (!user) return res.status(401).json({ success: false, message: 'Authentication required' });

  const projectId = await gateReportOrSend(req.params.reportId, user, res);
  if (!projectId) return;

  req.params.projectId = projectId;
  return getReportById(req, res);
};

export const updateReportGlobal = async (req: Request, res: Response) => {
  const user = req.user;
  if (!user) return res.status(401).json({ success: false, message: 'Authentication required' });

  const projectId = await gateReportOrSend(req.params.reportId, user, res);
  if (!projectId) return;

  req.params.projectId = projectId;
  return updateDailyReport(req, res);
};

export const acknowledgeReportGlobal = async (req: Request, res: Response) => {
  const user = req.user;
  if (!user) return res.status(401).json({ success: false, message: 'Authentication required' });

  const projectId = await gateReportOrSend(req.params.reportId, user, res);
  if (!projectId) return;

  req.params.projectId = projectId;
  return acknowledgeReport(req, res);
};

export const deleteReportGlobal = async (req: Request, res: Response) => {
  const user = req.user;
  if (!user) return res.status(401).json({ success: false, message: 'Authentication required' });

  const projectId = await gateReportOrSend(req.params.reportId, user, res);
  if (!projectId) return;

  req.params.projectId = projectId;
  return deleteDailyReport(req, res);
};

export const resolveBlockerGlobal = async (req: Request, res: Response) => {
  const user = req.user;
  if (!user) return res.status(401).json({ success: false, message: 'Authentication required' });

  const projectId = await gateReportOrSend(req.params.reportId, user, res);
  if (!projectId) return;

  req.params.projectId = projectId;
  return resolveBlocker(req, res);
};
