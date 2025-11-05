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

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Account routes
router.get('/accounts', getAccounts);
router.post('/accounts', createAccount);
router.put('/accounts/:id', updateAccount);

// Journal entry routes
router.get('/journal-entries', getJournalEntries);
router.post('/journal-entries', createJournalEntry);
router.post('/journal-entries/:id/post', postJournalEntry);

// Reports
router.get('/trial-balance', getTrialBalance);
router.get('/accounts/:accountId/ledger', getAccountLedger);
router.get('/reports', getFinancialReports);

// Transaction automation
router.post('/transactions/journal', createTransactionJournal);

export default router;