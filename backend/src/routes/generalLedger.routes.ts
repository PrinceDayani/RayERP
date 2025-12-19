import express from 'express';
import {
  getAccounts,
  createAccount,
  updateAccount,
  deleteAccount,
  getGroups,
  getGroupById,
  createGroup,
  updateGroup,
  deleteGroup,
  getSubGroups,
  getSubGroupById,
  createSubGroup,
  updateSubGroup,
  deleteSubGroup,
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
  createTransactionJournal,
  getVouchersByType,
  getCurrencies,
  createCurrency,
  updateCurrency,
  deleteCurrency,
  getExchangeRate,
  updateExchangeRate,
  getCostCenters,
  createCostCenter,
  updateCostCenter,
  deleteCostCenter,
  getCostCenterReport,
  getBillDetails,
  createBillDetail,
  updateBillDetail,
  deleteBillDetail,
  updateBillPayment,
  getBillStatement,
  calculateInterest,
  postInterestEntry,
  getInterestReport,
  getGLBudgets,
  createGLBudget,
  updateGLBudget,
  deleteGLBudget,
  getBudgetVarianceReport,
  getAccountBudgetStatus,
  recalculateBalances
} from '../controllers/generalLedgerController';
import { exportInvoice } from '../controllers/exportInvoice';
import {
  getAuditLogs,
  getCashFlowReport,
  getFundsFlowReport,
  getRatioAnalysis,
  exportData,
  importData,
  getScenarios,
  createScenario,
  updateScenario,
  deleteScenario,
  applyScenario,
  batchPostEntries,
  batchDeleteEntries
} from '../controllers/glAdvancedController';
import { authenticateToken } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/rbac.middleware';
import { journalEntryValidation, validate, accountValidation } from '../middleware/validation.middleware';

const router = express.Router();

import { requireFinanceAccess } from '../middleware/financePermission.middleware';

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Indian Accounting - Groups
router.get('/groups', requireFinanceAccess('accounts.view'), getGroups);
router.get('/groups/:id', requireFinanceAccess('accounts.view'), getGroupById);
router.post('/groups', requireFinanceAccess('accounts.create'), createGroup);
router.put('/groups/:id', requireFinanceAccess('accounts.edit'), updateGroup);
router.delete('/groups/:id', requireFinanceAccess('accounts.delete'), deleteGroup);

// Indian Accounting - Sub-Groups
router.get('/sub-groups', requireFinanceAccess('accounts.view'), getSubGroups);
router.get('/sub-groups/:id', requireFinanceAccess('accounts.view'), getSubGroupById);
router.post('/sub-groups', requireFinanceAccess('accounts.create'), createSubGroup);
router.put('/sub-groups/:id', requireFinanceAccess('accounts.edit'), updateSubGroup);
router.delete('/sub-groups/:id', requireFinanceAccess('accounts.delete'), deleteSubGroup);

// Indian Accounting - Ledgers
router.get('/ledgers', requireFinanceAccess('ledger.view'), getLedgers);
router.get('/ledgers/:id', requireFinanceAccess('ledger.view'), getLedgerById);
router.post('/ledgers', requireFinanceAccess('accounts.create'), createLedger);
router.put('/ledgers/:id', requireFinanceAccess('accounts.edit'), updateLedger);
router.delete('/ledgers/:id', requireFinanceAccess('accounts.delete'), deleteLedger);

// Hierarchy
router.get('/hierarchy', requireFinanceAccess('accounts.view'), getAccountHierarchy);

// Legacy Account routes
router.get('/accounts', requireFinanceAccess('accounts.view'), getAccounts);
router.post('/accounts', requireFinanceAccess('accounts.create'), accountValidation, validate, createAccount);
router.put('/accounts/:id', requireFinanceAccess('accounts.edit'), accountValidation, validate, updateAccount);
router.delete('/accounts/:id', requireFinanceAccess('accounts.delete'), deleteAccount);

// Journal entry routes
router.get('/journal-entries', requireFinanceAccess('journal.view'), getJournalEntries);
router.get('/journal-entries/:id', requireFinanceAccess('journal.view'), getJournalEntry);
router.get('/journal-entries/:id/audit-trail', requireFinanceAccess('journal.view'), getJournalEntry);
router.post('/journal-entries', requireFinanceAccess('journal.create'), journalEntryValidation, validate, createJournalEntry);
router.put('/journal-entries/:id', requireFinanceAccess('journal.edit'), journalEntryValidation, validate, updateJournalEntry);
router.post('/journal-entries/:id/post', requireFinanceAccess('journal.post'), postJournalEntry);
router.delete('/journal-entries/:id', requireFinanceAccess('journal.delete'), deleteJournalEntry);

// Reports
router.get('/trial-balance', requireFinanceAccess('ledger.view'), getTrialBalance);
router.get('/accounts/:accountId/ledger', requireFinanceAccess('ledger.view'), getAccountLedger);
router.get('/reports', requireFinanceAccess('ledger.view'), getFinancialReports);

// Transaction automation
router.post('/transactions/journal', requireFinanceAccess('journal.create'), createTransactionJournal);

// Voucher Types
router.get('/vouchers/:voucherType', requireFinanceAccess('ledger.view'), getVouchersByType);

// Multi-Currency
router.get('/currencies', requireFinanceAccess('accounts.view'), getCurrencies);
router.post('/currencies', requireFinanceAccess('accounts.create'), createCurrency);
router.put('/currencies/:id', requireFinanceAccess('accounts.edit'), updateCurrency);
router.delete('/currencies/:id', requireFinanceAccess('accounts.delete'), deleteCurrency);
router.get('/exchange-rates', requireFinanceAccess('accounts.view'), getExchangeRate);
router.post('/exchange-rates', requireFinanceAccess('accounts.edit'), updateExchangeRate);

// Cost Centers
router.get('/cost-centers', requireFinanceAccess('accounts.view'), getCostCenters);
router.post('/cost-centers', requireFinanceAccess('accounts.create'), createCostCenter);
router.put('/cost-centers/:id', requireFinanceAccess('accounts.edit'), updateCostCenter);
router.delete('/cost-centers/:id', requireFinanceAccess('accounts.delete'), deleteCostCenter);
router.get('/cost-centers/:costCenterId/report', requireFinanceAccess('ledger.view'), getCostCenterReport);

// Bill-wise Details
router.get('/accounts/:accountId/bills', requireFinanceAccess('bills.view'), getBillDetails);
router.post('/bills', requireFinanceAccess('bills.create'), createBillDetail);
router.put('/bills/:billId', requireFinanceAccess('bills.edit'), updateBillDetail);
router.delete('/bills/:billId', requireFinanceAccess('bills.delete'), deleteBillDetail);
router.put('/bills/:billId/payment', requireFinanceAccess('bills.edit'), updateBillPayment);
router.get('/accounts/:accountId/bill-statement', requireFinanceAccess('bills.view'), getBillStatement);

// Interest Calculations
router.post('/accounts/:accountId/calculate-interest', requireFinanceAccess('ledger.view'), calculateInterest);
router.post('/accounts/:accountId/post-interest', requireFinanceAccess('journal.create'), postInterestEntry);
router.get('/accounts/:accountId/interest-report', requireFinanceAccess('ledger.view'), getInterestReport);

// GL Budgets
router.get('/budgets', requireFinanceAccess('ledger.view'), getGLBudgets);
router.post('/budgets', requireFinanceAccess('accounts.create'), createGLBudget);
router.put('/budgets/:id', requireFinanceAccess('accounts.edit'), updateGLBudget);
router.delete('/budgets/:id', requireFinanceAccess('accounts.delete'), deleteGLBudget);
router.get('/budgets/variance-report', requireFinanceAccess('ledger.view'), getBudgetVarianceReport);
router.get('/accounts/:accountId/budget-status', requireFinanceAccess('ledger.view'), getAccountBudgetStatus);

// Audit Trail
router.get('/audit-logs', requireFinanceAccess('ledger.view'), getAuditLogs);

// Advanced Reports
router.get('/reports/cash-flow', requireFinanceAccess('ledger.view'), getCashFlowReport);
router.get('/reports/funds-flow', requireFinanceAccess('ledger.view'), getFundsFlowReport);
router.get('/reports/ratio-analysis', requireFinanceAccess('ledger.view'), getRatioAnalysis);

// Import/Export
router.get('/export', requireFinanceAccess('ledger.export'), exportData);
router.post('/import', requireFinanceAccess('accounts.create'), importData);

// Scenario Management
router.get('/scenarios', requireFinanceAccess('ledger.view'), getScenarios);
router.post('/scenarios', requireFinanceAccess('accounts.create'), createScenario);
router.put('/scenarios/:id', requireFinanceAccess('accounts.edit'), updateScenario);
router.delete('/scenarios/:id', requireFinanceAccess('accounts.delete'), deleteScenario);
router.post('/scenarios/:id/apply', requireFinanceAccess('journal.create'), applyScenario);

// Batch Operations
router.post('/batch/post', requireFinanceAccess('journal.post'), batchPostEntries);
router.post('/batch/delete', requireFinanceAccess('journal.delete'), batchDeleteEntries);

// Utility - Recalculate balances
router.post('/recalculate-balances', requireFinanceAccess('accounts.edit'), recalculateBalances);

// Export invoice
router.post('/export-invoice', requireFinanceAccess('ledger.export'), exportInvoice);

export default router;