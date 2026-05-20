import { Request, Response } from 'express';
import DailyReport from '../models/DailyReport';
import Project from '../models/Project';
import Employee from '../models/Employee';

// Create/Submit a daily report
export const createDailyReport = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { projectId } = req.params;
    const { reportDate, reportType, activities, financials, blockers, nextSteps, notes, status } = req.body;

    // Verify project exists and is reporting-based
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Get employee record
    const employee = await Employee.findOne({ user: user._id });
    if (!employee) {
      return res.status(403).json({ success: false, message: 'Employee record not found' });
    }

    // Check for duplicate report (same employee, same project, same date)
    const reportDateObj = new Date(reportDate);
    const startOfDay = new Date(reportDateObj.setHours(0, 0, 0, 0));
    const endOfDay = new Date(reportDateObj.setHours(23, 59, 59, 999));

    const existingReport = await DailyReport.findOne({
      reportedBy: employee._id,
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

    const report = new DailyReport({
      reportedBy: employee._id,
      project: projectId,
      reportDate: new Date(reportDate),
      reportType: reportType || 'daily',
      activities: activities || [],
      financials: financials || undefined,
      blockers: blockers || [],
      nextSteps: nextSteps || [],
      notes,
      status: status || 'submitted'
    });

    await report.save();

    const populatedReport = await DailyReport.findById(report._id)
      .populate('reportedBy', 'firstName lastName')
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
        .populate('reportedBy', 'firstName lastName')
        .populate('acknowledgedBy', 'firstName lastName')
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

    const employee = await Employee.findOne({ user: user._id });
    if (!employee) {
      return res.json({ success: true, data: [], pagination: { total: 0, page: 1, limit: 20, pages: 0 } });
    }

    const filter = { project: projectId, reportedBy: employee._id };
    const skip = (Number(page) - 1) * Number(limit);

    const [reports, total] = await Promise.all([
      DailyReport.find(filter)
        .populate('acknowledgedBy', 'firstName lastName')
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
      .populate('reportedBy', 'firstName lastName')
      .populate('acknowledgedBy', 'firstName lastName')
      .populate('blockers.resolvedBy', 'firstName lastName');

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    res.json({ success: true, data: report });
  } catch (error: any) {
    console.error('Get report by ID error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update a report (only if draft or own report)
export const updateDailyReport = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { projectId, reportId } = req.params;
    const updates = req.body;

    const employee = await Employee.findOne({ user: user._id });
    if (!employee) {
      return res.status(403).json({ success: false, message: 'Employee record not found' });
    }

    const report = await DailyReport.findOne({ _id: reportId, project: projectId });
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    // Only allow updates to own reports that are draft or submitted (not acknowledged)
    if (report.reportedBy.toString() !== employee._id.toString()) {
      return res.status(403).json({ success: false, message: 'You can only edit your own reports' });
    }

    if (report.status === 'acknowledged') {
      return res.status(400).json({ success: false, message: 'Cannot edit an acknowledged report' });
    }

    // Apply updates
    const allowedFields = ['activities', 'financials', 'blockers', 'nextSteps', 'notes', 'status', 'reportType'];
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        (report as any)[field] = updates[field];
      }
    }

    await report.save();

    const populatedReport = await DailyReport.findById(report._id)
      .populate('reportedBy', 'firstName lastName')
      .populate('acknowledgedBy', 'firstName lastName');

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

    const employee = await Employee.findOne({ user: user._id });
    if (!employee) {
      return res.status(403).json({ success: false, message: 'Employee record not found' });
    }

    // Verify user is a manager of this project
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const isManager = project.managers.some(m => m.toString() === employee._id.toString());
    const isOwner = project.owner.toString() === user._id.toString();
    const userRole = user.role as any;
    const isAdmin = userRole?.level >= 80;

    if (!isManager && !isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Only project managers can acknowledge reports' });
    }

    const report = await DailyReport.findOneAndUpdate(
      { _id: reportId, project: projectId, status: 'submitted' },
      { 
        status: 'acknowledged', 
        acknowledgedBy: employee._id, 
        acknowledgedAt: new Date() 
      },
      { new: true }
    )
      .populate('reportedBy', 'firstName lastName')
      .populate('acknowledgedBy', 'firstName lastName');

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found or already acknowledged' });
    }

    res.json({ success: true, data: report });
  } catch (error: any) {
    console.error('Acknowledge report error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete a report (only drafts by the owner)
export const deleteDailyReport = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { projectId, reportId } = req.params;

    const employee = await Employee.findOne({ user: user._id });
    if (!employee) {
      return res.status(403).json({ success: false, message: 'Employee record not found' });
    }

    const report = await DailyReport.findOne({ _id: reportId, project: projectId });
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    if (report.reportedBy.toString() !== employee._id.toString()) {
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

// Get reporting status (compliance - who reported, who didn't)
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
      .populate('team', 'firstName lastName')
      .populate('managers', 'firstName lastName');

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Get all reports for this date
    const reports = await DailyReport.find({
      project: projectId,
      reportDate: { $gte: startOfDay, $lte: endOfDay }
    }).populate('reportedBy', 'firstName lastName');

    const reportedEmployeeIds = reports.map(r => r.reportedBy._id.toString());

    // Build compliance list
    const teamMembers = [...(project.team || []), ...(project.managers || [])];
    const compliance = teamMembers.map((member: any) => ({
      employee: { _id: member._id, firstName: member.firstName, lastName: member.lastName },
      hasReported: reportedEmployeeIds.includes(member._id.toString()),
      report: reports.find(r => r.reportedBy._id.toString() === member._id.toString()) || null
    }));

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

    const employee = await Employee.findOne({ user: user._id });
    if (!employee) {
      return res.status(403).json({ success: false, message: 'Employee record not found' });
    }

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
    blocker.resolvedBy = employee._id;

    await report.save();

    const populatedReport = await DailyReport.findById(report._id)
      .populate('reportedBy', 'firstName lastName')
      .populate('blockers.resolvedBy', 'firstName lastName');

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
      .populate('reportedBy', 'firstName lastName')
      .populate('blockers.resolvedBy', 'firstName lastName')
      .sort({ reportDate: -1 });

    // Extract unresolved blockers with report context
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
