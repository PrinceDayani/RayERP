import express from 'express';
import {
  getAccounts,
  createAccount,
  updateAccount,
  getJournalEntries,
  createJournalEntry,
  postJournalEntry,
  getTrialBalance,
  getAccountLedger,
  getFinancialReports,
  createTransactionJournal
} from '../controllers/generalLedgerController';
import { authenticateToken } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/rbac.middleware';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);
router.use(requirePermission('finance.view'));

// Account routes
router.get('/accounts', getAccounts);
router.post('/accounts', createAccount);
router.put('/accounts/:id', updateAccount);
router.delete('/accounts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const account = await require('../models/Account').Account.findByIdAndDelete(id);
    if (!account) return res.status(404).json({ message: 'Account not found' });
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting account' });
  }
});

// Journal entry routes
router.get('/journal-entries', getJournalEntries);
router.get('/journal-entries/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const entry = await require('../models/JournalEntry').JournalEntry.findById(id)
      .populate('lines.accountId', 'code name')
      .populate('createdBy', 'name email');
    if (!entry) return res.status(404).json({ message: 'Journal entry not found' });
    res.json(entry);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching journal entry' });
  }
});
router.post('/journal-entries', createJournalEntry);
router.put('/journal-entries/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const entry = await require('../models/JournalEntry').JournalEntry.findById(id);
    if (!entry) return res.status(404).json({ message: 'Journal entry not found' });
    if (entry.isPosted) return res.status(400).json({ message: 'Cannot edit posted journal entry' });
    
    const updated = await require('../models/JournalEntry').JournalEntry.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    ).populate('lines.accountId', 'code name').populate('createdBy', 'name email');
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : 'Error updating journal entry' });
  }
});
router.post('/journal-entries/:id/post', postJournalEntry);
router.delete('/journal-entries/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const entry = await require('../models/JournalEntry').JournalEntry.findByIdAndDelete(id);
    if (!entry) return res.status(404).json({ message: 'Journal entry not found' });
    res.json({ message: 'Journal entry deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting journal entry' });
  }
});

// Reports
router.get('/trial-balance', getTrialBalance);
router.get('/accounts/:accountId/ledger', getAccountLedger);
router.get('/reports', getFinancialReports);

// Transaction automation
router.post('/transactions/journal', createTransactionJournal);

export default router;