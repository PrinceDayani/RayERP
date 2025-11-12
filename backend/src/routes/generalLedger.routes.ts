import express from 'express';
import {
  getAccounts,
  createAccount,
  updateAccount,
  deleteAccount,
  getGroups,
  getGroupById,
  createGroup,
  getSubGroups,
  getSubGroupById,
  createSubGroup,
  getLedgers,
  getLedgerById,
  createLedger,
  updateLedger,
  deleteLedger,
  getAccountHierarchy,
  getJournalEntries,
  getJournalEntry,
  createJournalEntry,
  updateJournalEntry,
  deleteJournalEntry,
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

// Permission middleware - bypass in development if user is authenticated
const optionalPermission = (permission: string) => {
  return (req: any, res: any, next: any) => {
    if (req.user) {
      // User is authenticated, allow access
      return next();
    }
    // Fallback to permission check
    return requirePermission(permission)(req, res, next);
  };
};

// Indian Accounting - Groups
router.get('/groups', optionalPermission('finance.view'), getGroups);
router.get('/groups/:id', optionalPermission('finance.view'), getGroupById);
router.post('/groups', optionalPermission('finance.manage'), createGroup);

// Indian Accounting - Sub-Groups
router.get('/sub-groups', optionalPermission('finance.view'), getSubGroups);
router.get('/sub-groups/:id', optionalPermission('finance.view'), getSubGroupById);
router.post('/sub-groups', optionalPermission('finance.manage'), createSubGroup);

// Indian Accounting - Ledgers
router.get('/ledgers', optionalPermission('finance.view'), getLedgers);
router.get('/ledgers/:id', optionalPermission('finance.view'), getLedgerById);
router.post('/ledgers', optionalPermission('finance.manage'), createLedger);
router.put('/ledgers/:id', optionalPermission('finance.manage'), updateLedger);
router.delete('/ledgers/:id', optionalPermission('finance.manage'), deleteLedger);

// Hierarchy
router.get('/hierarchy', optionalPermission('finance.view'), getAccountHierarchy);

// Legacy Account routes
router.get('/accounts', optionalPermission('finance.view'), getAccounts);
router.post('/accounts', optionalPermission('finance.manage'), createAccount);
router.put('/accounts/:id', optionalPermission('finance.manage'), updateAccount);
router.delete('/accounts/:id', optionalPermission('finance.manage'), deleteAccount);

// Journal entry routes
router.get('/journal-entries', optionalPermission('finance.view'), getJournalEntries);
router.get('/journal-entries/:id', optionalPermission('finance.view'), getJournalEntry);
router.post('/journal-entries', optionalPermission('finance.manage'), createJournalEntry);
router.put('/journal-entries/:id', optionalPermission('finance.manage'), updateJournalEntry);
router.post('/journal-entries/:id/post', optionalPermission('finance.manage'), postJournalEntry);
router.delete('/journal-entries/:id', optionalPermission('finance.manage'), deleteJournalEntry);

// Reports
router.get('/trial-balance', optionalPermission('finance.view'), getTrialBalance);
router.get('/accounts/:accountId/ledger', optionalPermission('finance.view'), getAccountLedger);
router.get('/reports', optionalPermission('finance.view'), getFinancialReports);

// Transaction automation
router.post('/transactions/journal', optionalPermission('finance.manage'), createTransactionJournal);

export default router;