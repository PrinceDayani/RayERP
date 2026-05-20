import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/rbac.middleware';

// Daily Report controllers
import {
  createDailyReport,
  getProjectReports,
  getMyReports,
  getReportById,
  updateDailyReport,
  acknowledgeReport,
  deleteDailyReport,
  getReportingStatus,
  resolveBlocker,
  getUnresolvedBlockers
} from '../controllers/dailyReportController';

// Financial Entry controllers
import {
  createFinancialEntry,
  getProjectFinancialEntries,
  approveFinancialEntry,
  rejectFinancialEntry,
  getFinancialSummary,
  deleteFinancialEntry,
  exportFinancialEntries
} from '../controllers/financialEntryController';

// Reporting Schedule controllers
import {
  upsertReportingSchedule,
  getReportingSchedule,
  deactivateReportingSchedule
} from '../controllers/reportingScheduleController';

// Progress controllers
import {
  getProgressSummary,
  generateProgressSnapshot,
  getProgressHistory
} from '../controllers/projectProgressController';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

// ==========================================
// DAILY REPORTS
// ==========================================

// Submit a daily report for a project
router.post(
  '/:projectId/reports',
  requirePermission('projects.view'),
  createDailyReport
);

// Get all reports for a project (managers/admins)
router.get(
  '/:projectId/reports',
  requirePermission('projects.view'),
  getProjectReports
);

// Get my reports for a project
router.get(
  '/:projectId/reports/my',
  requirePermission('projects.view'),
  getMyReports
);

// Get reporting compliance status
router.get(
  '/:projectId/reporting-status',
  requirePermission('projects.view'),
  getReportingStatus
);

// Get a single report
router.get(
  '/:projectId/reports/:reportId',
  requirePermission('projects.view'),
  getReportById
);

// Update a report
router.put(
  '/:projectId/reports/:reportId',
  requirePermission('projects.view'),
  updateDailyReport
);

// Acknowledge a report (manager)
router.patch(
  '/:projectId/reports/:reportId/acknowledge',
  requirePermission('projects.edit'),
  acknowledgeReport
);

// Delete a report (only drafts)
router.delete(
  '/:projectId/reports/:reportId',
  requirePermission('projects.view'),
  deleteDailyReport
);

// Get unresolved blockers for a project
router.get(
  '/:projectId/blockers',
  requirePermission('projects.view'),
  getUnresolvedBlockers
);

// Resolve a blocker
router.patch(
  '/:projectId/reports/:reportId/blockers/:blockerId/resolve',
  requirePermission('projects.edit'),
  resolveBlocker
);

// ==========================================
// FINANCIAL ENTRIES
// ==========================================

// Create a financial entry
router.post(
  '/:projectId/financial-entries',
  requirePermission('projects.view'),
  createFinancialEntry
);

// Get all financial entries for a project
router.get(
  '/:projectId/financial-entries',
  requirePermission('projects.view'),
  getProjectFinancialEntries
);

// Get financial summary
router.get(
  '/:projectId/financial-summary',
  requirePermission('projects.view'),
  getFinancialSummary
);

// Export financial entries as CSV
router.get(
  '/:projectId/financial-entries/export',
  requirePermission('projects.view'),
  exportFinancialEntries
);

// Approve a financial entry (manager)
router.patch(
  '/:projectId/financial-entries/:entryId/approve',
  requirePermission('projects.edit'),
  approveFinancialEntry
);

// Reject a financial entry (manager)
router.patch(
  '/:projectId/financial-entries/:entryId/reject',
  requirePermission('projects.edit'),
  rejectFinancialEntry
);

// Delete a financial entry (only pending, by reporter)
router.delete(
  '/:projectId/financial-entries/:entryId',
  requirePermission('projects.view'),
  deleteFinancialEntry
);

// ==========================================
// REPORTING SCHEDULE
// ==========================================

// Create or update reporting schedule
router.post(
  '/:projectId/reporting-schedule',
  requirePermission('projects.edit'),
  upsertReportingSchedule
);

// Get reporting schedule
router.get(
  '/:projectId/reporting-schedule',
  requirePermission('projects.view'),
  getReportingSchedule
);

// Deactivate reporting schedule
router.delete(
  '/:projectId/reporting-schedule',
  requirePermission('projects.edit'),
  deactivateReportingSchedule
);

// ==========================================
// PROGRESS & SNAPSHOTS
// ==========================================

// Get progress summary (real-time calculation)
router.get(
  '/:projectId/progress-summary',
  requirePermission('projects.view'),
  getProgressSummary
);

// Generate a progress snapshot
router.post(
  '/:projectId/progress-snapshot',
  requirePermission('projects.edit'),
  generateProgressSnapshot
);

// Get historical progress snapshots
router.get(
  '/:projectId/progress-history',
  requirePermission('projects.view'),
  getProgressHistory
);

// ==========================================
// REPORTING REMINDERS (Cron/Manual trigger)
// ==========================================

router.post(
  '/system/check-overdue-reports',
  requirePermission('projects.edit'),
  async (req, res) => {
    try {
      const { checkOverdueReports } = await import('../services/reportingReminderService');
      const results = await checkOverdueReports();
      res.json({ success: true, data: results });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

// ==========================================
// BULK OPERATIONS
// ==========================================

// Bulk acknowledge reports
router.post(
  '/:projectId/reports/bulk-acknowledge',
  requirePermission('projects.edit'),
  async (req, res) => {
    try {
      const user = req.user;
      if (!user) return res.status(401).json({ success: false, message: 'Authentication required' });

      const { projectId } = req.params;
      const { reportIds } = req.body;

      if (!reportIds || !Array.isArray(reportIds) || reportIds.length === 0) {
        return res.status(400).json({ success: false, message: 'reportIds array is required' });
      }

      const Employee = (await import('../models/Employee')).default;
      const employee = await Employee.findOne({ user: user._id });
      if (!employee) return res.status(403).json({ success: false, message: 'Employee record not found' });

      const DailyReport = (await import('../models/DailyReport')).default;
      const result = await DailyReport.updateMany(
        { _id: { $in: reportIds }, project: projectId, status: 'submitted' },
        { status: 'acknowledged', acknowledgedBy: employee._id, acknowledgedAt: new Date() }
      );

      res.json({ success: true, data: { acknowledged: result.modifiedCount, total: reportIds.length } });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

// Bulk approve financial entries
router.post(
  '/:projectId/financial-entries/bulk-approve',
  requirePermission('projects.edit'),
  async (req, res) => {
    try {
      const user = req.user;
      if (!user) return res.status(401).json({ success: false, message: 'Authentication required' });

      const { projectId } = req.params;
      const { entryIds } = req.body;

      if (!entryIds || !Array.isArray(entryIds) || entryIds.length === 0) {
        return res.status(400).json({ success: false, message: 'entryIds array is required' });
      }

      const Employee = (await import('../models/Employee')).default;
      const employee = await Employee.findOne({ user: user._id });
      if (!employee) return res.status(403).json({ success: false, message: 'Employee record not found' });

      const FinancialEntry = (await import('../models/FinancialEntry')).default;
      const result = await FinancialEntry.updateMany(
        { _id: { $in: entryIds }, project: projectId, status: 'pending' },
        { status: 'approved', approvedBy: employee._id, approvedAt: new Date() }
      );

      res.json({ success: true, data: { approved: result.modifiedCount, total: entryIds.length } });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

// ==========================================
// WEEKLY SUMMARY (Auto-generated)
// ==========================================

router.get(
  '/:projectId/weekly-summary',
  requirePermission('projects.view'),
  async (req, res) => {
    try {
      const { projectId } = req.params;
      const { weekStart } = req.query;

      const startDate = weekStart ? new Date(weekStart as string) : new Date();
      // Get Monday of the week
      const day = startDate.getDay();
      const diff = startDate.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(startDate.setDate(diff));
      monday.setHours(0, 0, 0, 0);
      const sunday = new Date(monday);
      sunday.setDate(sunday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);

      const DailyReport = (await import('../models/DailyReport')).default;
      const FinancialEntry = (await import('../models/FinancialEntry')).default;

      const [reports, financialEntries, blockerData] = await Promise.all([
        DailyReport.find({
          project: projectId,
          reportDate: { $gte: monday, $lte: sunday }
        }).populate('reportedBy', 'firstName lastName').sort({ reportDate: 1 }),

        FinancialEntry.aggregate([
          { $match: { project: new (await import('mongoose')).default.Types.ObjectId(projectId), date: { $gte: monday, $lte: sunday } } },
          { $group: {
            _id: '$entryType',
            total: { $sum: '$amount' },
            count: { $sum: 1 }
          }}
        ]),

        DailyReport.aggregate([
          { $match: { project: new (await import('mongoose')).default.Types.ObjectId(projectId), reportDate: { $gte: monday, $lte: sunday } } },
          { $unwind: '$blockers' },
          { $group: {
            _id: null,
            total: { $sum: 1 },
            resolved: { $sum: { $cond: ['$blockers.isResolved', 1, 0] } },
            unresolved: { $sum: { $cond: [{ $eq: ['$blockers.isResolved', false] }, 1, 0] } }
          }}
        ])
      ]);

      // Aggregate activities by category
      const activitySummary: Record<string, { hours: number; count: number }> = {};
      let totalHours = 0;
      reports.forEach((report: any) => {
        report.activities.forEach((activity: any) => {
          const cat = activity.category || 'other';
          if (!activitySummary[cat]) activitySummary[cat] = { hours: 0, count: 0 };
          activitySummary[cat].hours += activity.hoursSpent || 0;
          activitySummary[cat].count += 1;
          totalHours += activity.hoursSpent || 0;
        });
      });

      // Unique reporters
      const reporters = [...new Set(reports.map((r: any) => r.reportedBy?._id?.toString()))];

      const financialSummary = financialEntries.reduce((acc: any, entry: any) => {
        acc[entry._id] = { total: entry.total, count: entry.count };
        return acc;
      }, {});

      res.json({
        success: true,
        data: {
          weekStart: monday,
          weekEnd: sunday,
          reportCount: reports.length,
          uniqueReporters: reporters.length,
          totalHours,
          activitySummary,
          financialSummary,
          blockers: {
            total: blockerData[0]?.total || 0,
            resolved: blockerData[0]?.resolved || 0,
            unresolved: blockerData[0]?.unresolved || 0
          },
          reports: reports.map((r: any) => ({
            _id: r._id,
            reportDate: r.reportDate,
            reportedBy: r.reportedBy,
            status: r.status,
            totalHours: r.totalHours,
            activitiesCount: r.activities.length,
            blockersCount: r.blockers.length
          }))
        }
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

export default router;
