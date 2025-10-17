import express from 'express';
import { generalLedgerController } from '../controllers/generalLedgerController';
import { chartOfAccountsController } from '../controllers/chartOfAccountsController';
import { journalEntryController } from '../controllers/journalEntryController';
import { costCenterController } from '../controllers/costCenterController';
import { protect } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/rbac.middleware';

const router = express.Router();

// Apply authentication to all routes
router.use(protect);

// Chart of Accounts Routes
router.get('/accounts', requirePermission('finance_read'), chartOfAccountsController.getAll);
router.post('/accounts', requirePermission('finance_write'), chartOfAccountsController.create);
router.put('/accounts/:id', requirePermission('finance_write'), chartOfAccountsController.update);
router.get('/accounts/hierarchy', requirePermission('finance_read'), chartOfAccountsController.getHierarchy);
router.get('/accounts/project/:projectCode', requirePermission('finance_read'), chartOfAccountsController.getByProject);
router.get('/accounts/:id/balance', requirePermission('finance_read'), chartOfAccountsController.getBalance);

// Journal Entry Routes
router.get('/journal-entries', requirePermission('finance_read'), journalEntryController.getAll);
router.post('/journal-entries', requirePermission('finance_write'), journalEntryController.create);
router.get('/journal-entries/:id', requirePermission('finance_read'), journalEntryController.getById);
router.put('/journal-entries/:id', requirePermission('finance_write'), journalEntryController.update);
router.delete('/journal-entries/:id', requirePermission('finance_write'), journalEntryController.delete);
router.post('/journal-entries/:id/approve', requirePermission('finance_approve'), journalEntryController.approve);
router.post('/journal-entries/:id/post', requirePermission('finance_approve'), journalEntryController.post);
router.get('/journal-entries/project/:projectId', requirePermission('finance_read'), journalEntryController.getByProject);

// Cost Center Routes
router.get('/cost-centers', requirePermission('finance_read'), costCenterController.getAll);
router.post('/cost-centers', requirePermission('finance_write'), costCenterController.create);
router.put('/cost-centers/:id', requirePermission('finance_write'), costCenterController.update);
router.get('/cost-centers/project/:projectId', requirePermission('finance_read'), costCenterController.getByProject);

// Reports Routes
router.get('/reports/trial-balance', requirePermission('finance_read'), generalLedgerController.getTrialBalance);
router.get('/reports/ledger-statement/:accountId', requirePermission('finance_read'), generalLedgerController.getLedgerStatement);
router.get('/reports/balance-sheet', requirePermission('finance_read'), generalLedgerController.getBalanceSheet);
router.get('/reports/profit-loss', requirePermission('finance_read'), generalLedgerController.getProfitLoss);
router.get('/reports/cash-flow', requirePermission('finance_read'), generalLedgerController.getCashFlowStatement);
router.get('/reports/project-cost/:projectId', requirePermission('finance_read'), generalLedgerController.getProjectCostReport);
router.get('/reports/aging', requirePermission('finance_read'), generalLedgerController.getAgingReport);

// Dashboard
router.get('/dashboard', requirePermission('finance_read'), generalLedgerController.getDashboard);

export default router;