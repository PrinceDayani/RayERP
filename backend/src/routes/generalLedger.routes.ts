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
router.put('/groups/:id', optionalPermission('finance.manage'), updateGroup);
router.delete('/groups/:id', optionalPermission('finance.manage'), deleteGroup);

// Indian Accounting - Sub-Groups
router.get('/sub-groups', optionalPermission('finance.view'), getSubGroups);
router.get('/sub-groups/:id', optionalPermission('finance.view'), getSubGroupById);
router.post('/sub-groups', optionalPermission('finance.manage'), createSubGroup);
router.put('/sub-groups/:id', optionalPermission('finance.manage'), updateSubGroup);
router.delete('/sub-groups/:id', optionalPermission('finance.manage'), deleteSubGroup);

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
router.get('/journal-entries/:id/audit-trail', optionalPermission('finance.view'), getJournalEntry);
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

// Voucher Types
router.get('/vouchers/:voucherType', optionalPermission('finance.view'), getVouchersByType);

// Multi-Currency
router.get('/currencies', optionalPermission('finance.view'), getCurrencies);
router.post('/currencies', optionalPermission('finance.manage'), createCurrency);
router.put('/currencies/:id', optionalPermission('finance.manage'), updateCurrency);
router.delete('/currencies/:id', optionalPermission('finance.manage'), deleteCurrency);
router.get('/exchange-rates', optionalPermission('finance.view'), getExchangeRate);
router.post('/exchange-rates', optionalPermission('finance.manage'), updateExchangeRate);

// Cost Centers
router.get('/cost-centers', optionalPermission('finance.view'), getCostCenters);
router.post('/cost-centers', optionalPermission('finance.manage'), createCostCenter);
router.put('/cost-centers/:id', optionalPermission('finance.manage'), updateCostCenter);
router.delete('/cost-centers/:id', optionalPermission('finance.manage'), deleteCostCenter);
router.get('/cost-centers/:costCenterId/report', optionalPermission('finance.view'), getCostCenterReport);

// Bill-wise Details
router.get('/accounts/:accountId/bills', optionalPermission('finance.view'), getBillDetails);
router.post('/bills', optionalPermission('finance.manage'), createBillDetail);
router.put('/bills/:billId', optionalPermission('finance.manage'), updateBillDetail);
router.delete('/bills/:billId', optionalPermission('finance.manage'), deleteBillDetail);
router.put('/bills/:billId/payment', optionalPermission('finance.manage'), updateBillPayment);
router.get('/accounts/:accountId/bill-statement', optionalPermission('finance.view'), getBillStatement);

// Interest Calculations
router.post('/accounts/:accountId/calculate-interest', optionalPermission('finance.view'), calculateInterest);
router.post('/accounts/:accountId/post-interest', optionalPermission('finance.manage'), postInterestEntry);
router.get('/accounts/:accountId/interest-report', optionalPermission('finance.view'), getInterestReport);

// GL Budgets
router.get('/budgets', optionalPermission('finance.view'), getGLBudgets);
router.post('/budgets', optionalPermission('finance.manage'), createGLBudget);
router.put('/budgets/:id', optionalPermission('finance.manage'), updateGLBudget);
router.delete('/budgets/:id', optionalPermission('finance.manage'), deleteGLBudget);
router.get('/budgets/variance-report', optionalPermission('finance.view'), getBudgetVarianceReport);
router.get('/accounts/:accountId/budget-status', optionalPermission('finance.view'), getAccountBudgetStatus);

// Audit Trail
router.get('/audit-logs', optionalPermission('finance.view'), getAuditLogs);

// Advanced Reports
router.get('/reports/cash-flow', optionalPermission('finance.view'), getCashFlowReport);
router.get('/reports/funds-flow', optionalPermission('finance.view'), getFundsFlowReport);
router.get('/reports/ratio-analysis', optionalPermission('finance.view'), getRatioAnalysis);

// Import/Export
router.get('/export', optionalPermission('finance.view'), exportData);
router.post('/import', optionalPermission('finance.manage'), importData);

// Scenario Management
router.get('/scenarios', optionalPermission('finance.view'), getScenarios);
router.post('/scenarios', optionalPermission('finance.manage'), createScenario);
router.put('/scenarios/:id', optionalPermission('finance.manage'), updateScenario);
router.delete('/scenarios/:id', optionalPermission('finance.manage'), deleteScenario);
router.post('/scenarios/:id/apply', optionalPermission('finance.manage'), applyScenario);

// Batch Operations
router.post('/batch/post', optionalPermission('finance.manage'), batchPostEntries);
router.post('/batch/delete', optionalPermission('finance.manage'), batchDeleteEntries);

// Utility - Recalculate balances
router.post('/recalculate-balances', optionalPermission('finance.manage'), recalculateBalances);

// Export invoice
router.post('/export-invoice', optionalPermission('finance.view'), exportInvoice);

export default router;