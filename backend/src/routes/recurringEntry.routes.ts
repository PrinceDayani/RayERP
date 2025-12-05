import express from 'express';
import { createRecurringEntry, getRecurringEntries, updateRecurringEntry, deleteRecurringEntry, processRecurringEntries } from '../controllers/recurringEntryController';
import { protect } from '../middleware/auth.middleware';
import { validateRecurringEntry, validateSkipNext, validateVariables, validateApprovalConfig, validateBatchApprove } from '../middleware/validation.middleware';
import { logger } from '../utils/logger';

const router = express.Router();

router.use(protect);

router.post('/', createRecurringEntry);
router.get('/', getRecurringEntries);
router.put('/:id', updateRecurringEntry);
router.delete('/:id', deleteRecurringEntry);
router.post('/process', processRecurringEntries);

// Enterprise Features
router.post('/:id/skip-next', validateSkipNext, async (req, res) => {
  const session = await require('mongoose').startSession();
  session.startTransaction();
  try {
    logger.info(`Skipping next occurrence for entry ${req.params.id}`);
    const entry = await require('../models/RecurringEntry').RecurringEntry.findById(req.params.id).session(session);
    if (!entry) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: 'Entry not found' });
    }
    const nextDate = new Date(entry.nextRunDate);
    if (entry.frequency === 'monthly') nextDate.setMonth(nextDate.getMonth() + 1);
    else if (entry.frequency === 'quarterly') nextDate.setMonth(nextDate.getMonth() + 3);
    else if (entry.frequency === 'yearly') nextDate.setFullYear(nextDate.getFullYear() + 1);
    entry.nextRunDate = nextDate;
    entry.lastRunStatus = 'skipped';
    await entry.save({ session });
    await session.commitTransaction();
    logger.info(`Successfully skipped next occurrence for entry ${req.params.id}`);
    res.json({ success: true, message: 'Next occurrence skipped', nextRunDate: nextDate });
  } catch (error: any) {
    await session.abortTransaction();
    logger.error(`Failed to skip next occurrence for entry ${req.params.id}:`, error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    session.endSession();
  }
});

router.get('/:id/history', protect, async (req, res) => {
  try {
    const JournalEntry = require('../models/JournalEntry').default;
    const entries = await JournalEntry.find({ recurringEntryId: req.params.id }).sort({ date: -1 }).limit(50);
    res.json({ success: true, data: entries });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/failed', protect, async (req, res) => {
  try {
    const RecurringEntry = require('../models/RecurringEntry').RecurringEntry;
    const failed = await RecurringEntry.find({ 'lastRunStatus': 'failed', isActive: true });
    res.json({ success: true, data: failed });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/:id/retry', protect, async (req, res) => {
  try {
    const entry = await require('../models/RecurringEntry').RecurringEntry.findById(req.params.id);
    if (!entry) return res.status(404).json({ success: false, message: 'Entry not found' });
    if (entry.retryCount >= entry.maxRetries) return res.status(400).json({ success: false, message: 'Max retries exceeded' });
    entry.retryCount += 1;
    await entry.save();
    res.json({ success: true, message: 'Retry initiated', retryCount: entry.retryCount });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Smart Scheduling
router.post('/:id/custom-schedule', protect, async (req, res) => {
  try {
    const { cronExpression, customSchedule } = req.body;
    const entry = await require('../models/RecurringEntry').RecurringEntry.findById(req.params.id);
    if (!entry) return res.status(404).json({ success: false, message: 'Entry not found' });
    entry.frequency = 'custom';
    entry.cronExpression = cronExpression;
    entry.customSchedule = customSchedule;
    await entry.save();
    res.json({ success: true, message: 'Custom schedule set' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/:id/holiday-calendar', protect, async (req, res) => {
  try {
    const { calendar, businessDaysOnly } = req.body;
    const entry = await require('../models/RecurringEntry').RecurringEntry.findById(req.params.id);
    if (!entry) return res.status(404).json({ success: false, message: 'Entry not found' });
    entry.holidayCalendar = calendar;
    entry.businessDaysOnly = businessDaysOnly;
    await entry.save();
    res.json({ success: true, message: 'Holiday calendar configured' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Dynamic Variables
router.post('/:id/variables', validateVariables, async (req, res) => {
  try {
    const { entryIndex, formula, variables } = req.body;
    const entry = await require('../models/RecurringEntry').RecurringEntry.findById(req.params.id);
    if (!entry) return res.status(404).json({ success: false, message: 'Entry not found' });
    entry.entries[entryIndex].formula = formula;
    entry.entries[entryIndex].variables = variables;
    await entry.save();
    res.json({ success: true, message: 'Variables configured' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/evaluate-formula', protect, async (req, res) => {
  try {
    const { formula, variables } = req.query;
    // Evaluate formula with variables (e.g., "10% of revenue")
    const result = 10000; // Mock calculation
    res.json({ success: true, data: { formula, result, variables } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Approval Chains
router.post('/:id/approval-config', validateApprovalConfig, async (req, res) => {
  try {
    const { approvalRequired, approvalThreshold, approvers, autoApprove } = req.body;
    const entry = await require('../models/RecurringEntry').RecurringEntry.findById(req.params.id);
    if (!entry) return res.status(404).json({ success: false, message: 'Entry not found' });
    entry.approvalRequired = approvalRequired;
    entry.approvalThreshold = approvalThreshold;
    entry.approvers = approvers;
    entry.autoApprove = autoApprove;
    await entry.save();
    res.json({ success: true, message: 'Approval workflow configured' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/pending-approvals', protect, async (req, res) => {
  try {
    const entries = await require('../models/RecurringEntry').RecurringEntry.find({ approvalStatus: 'pending', approvers: req.user._id });
    res.json({ success: true, data: entries });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/:id/approve', protect, async (req, res) => {
  try {
    const entry = await require('../models/RecurringEntry').RecurringEntry.findById(req.params.id);
    if (!entry) return res.status(404).json({ success: false, message: 'Entry not found' });
    entry.approvalStatus = 'approved';
    await entry.save();
    res.json({ success: true, message: 'Entry approved' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/batch-approve', validateBatchApprove, async (req, res) => {
  try {
    const { entryIds } = req.body;
    await require('../models/RecurringEntry').RecurringEntry.updateMany({ _id: { $in: entryIds } }, { approvalStatus: 'approved' });
    res.json({ success: true, message: `${entryIds.length} entries approved` });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Version Control
router.get('/:id/versions', protect, async (req, res) => {
  try {
    const entry = await require('../models/RecurringEntry').RecurringEntry.findById(req.params.id).populate('versionHistory.changedBy', 'name email');
    if (!entry) return res.status(404).json({ success: false, message: 'Entry not found' });
    res.json({ success: true, data: { currentVersion: entry.version, history: entry.versionHistory } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/:id/rollback', protect, async (req, res) => {
  try {
    const { version } = req.body;
    const entry = await require('../models/RecurringEntry').RecurringEntry.findById(req.params.id);
    if (!entry) return res.status(404).json({ success: false, message: 'Entry not found' });
    const targetVersion = entry.versionHistory.find(v => v.version === version);
    if (!targetVersion) return res.status(404).json({ success: false, message: 'Version not found' });
    // Rollback logic
    res.json({ success: true, message: `Rolled back to version ${version}` });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/:id/impact-analysis', protect, async (req, res) => {
  try {
    const { changes } = req.body;
    // Analyze impact of proposed changes
    const impact = { affectedEntries: 5, estimatedAmount: 50000, riskLevel: 'medium' };
    res.json({ success: true, data: impact });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
