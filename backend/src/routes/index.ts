//project\backend\src\routes\index.ts
import authRoutes from "./auth.routes";
import userRoutes from "./user.routes";
import employeeRoutes from "./employee.routes";
import projectRoutes from "./project.routes";
import taskRoutes from "./task.routes";
import attendanceRoutes from "./attendance.routes";
import reportRoutes from './report.routes';
import express from 'express';
import contactRoutes from './contact.routes';
import analyticsRoutes from './analytics.routes';
import settingsRoutes from './settings.routes';
import accountingSettingsRoutes from './settings.routes';
import adminRoutes from './admin.routes';
import leaveRoutes from './leave.routes';
import employeeReportRoutes from './employeeReport.routes';
import activityRoutes from './activity.routes';
import rbacRoutes from './rbac.routes';
import projectTemplateRoutes from './projectTemplate.routes';
import resourceRoutes from './resourceRoutes';
import departmentRoutes from './department.routes';
import departmentBudgetRoutes from './departmentBudget.routes';
import onboardingRoutes from './onboarding.routes';
import fileShareRoutes from './fileShare.routes';
import chatRoutes from './chat.routes';
import broadcastRoutes from './broadcast.routes';
// --- Merged Financial & Ledger Routes ---
import budgetRoutes from './budgetRoutes';
import budgetTemplateRoutes from './budgetTemplateRoutes';
import accountRoutes from './account.routes';
import transactionRoutes from './transaction.routes';
import invoiceRoutes from './invoice.routes';
import paymentRoutes from './payment.routes';
import expenseRoutes from './expense.routes';
import financialReportRoutes from './financialReport.routes';
import projectLedgerRoutes from './projectLedger.routes';
import generalLedgerRoutes from './generalLedger.routes';
import integratedFinanceRoutes from './integratedFinance.routes';
import dashboardRoutes from './dashboard.routes';
import periodClosingRoutes from './periodClosing.routes';
import bankReconciliationRoutes from './bankReconciliation.routes';
import recurringEntryRoutes from './recurringEntry.routes';
import voucherRoutes from './voucher.routes';
import advancedReportRoutes from './advancedReport.routes';
import indianAccountRoutes from './indianAccount.routes';
import financeAdvancedRoutes from './financeAdvanced.routes';
import billsRoutes from './bills.routes';
import costCenterRoutes from './costCenter.routes';
import chartOfAccountsRoutes from './chartOfAccounts.routes';
import glBudgetRoutes from './glBudget.routes';
import interestCalculationRoutes from './interestCalculation.routes';
import invoiceEnhancedRoutes from './invoiceEnhanced.routes';
import journalEnhancedRoutes from './journalEnhanced.routes';
import invoiceTemplateRoutes from './invoiceTemplate.routes';
import journalTemplateRoutes from './journalTemplate.routes';
import allocationRuleRoutes from './allocationRule.routes';
import invoiceNewRoutes from './invoice.routes';
import journalEntryRoutes from './journalEntry.routes';
import invoiceTemplateNewRoutes from './invoiceTemplate.routes';
import journalEntryTemplateRoutes from './journalEntryTemplate.routes';
import projectFinanceEnhanced from './projectFinanceEnhanced';
import financialReportsEnhanced from './financialReportsEnhanced';

import backupRoutes from './backupRoutes';
import notificationRoutes from './notification.routes';

const router = express.Router();

// --- Core Application Routes ---
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/employees", employeeRoutes);
router.use("/projects", projectRoutes);
router.use("/tasks", taskRoutes);
router.use("/attendance", attendanceRoutes);
router.use("/reports", reportRoutes);
router.use('/contacts', contactRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/settings', settingsRoutes);
router.use('/accounting-settings', accountingSettingsRoutes);
router.use('/admin', adminRoutes);
router.use('/leaves', leaveRoutes);
router.use('/employee-reports', employeeReportRoutes);
router.use('/activities', activityRoutes);
router.use('/activity', activityRoutes); // Alias for singular form
router.use('/rbac', rbacRoutes);
router.use('/project-templates', projectTemplateRoutes);
router.use('/resources', resourceRoutes);
router.use('/departments', departmentRoutes);
router.use('/department-budgets', departmentBudgetRoutes);
router.use('/onboarding', onboardingRoutes);
router.use('/dashboard', dashboardRoutes);

router.use('/file-shares', fileShareRoutes);
router.use('/chat', chatRoutes);
router.use('/broadcast', broadcastRoutes);
router.use('/backup', backupRoutes);
router.use('/notifications', notificationRoutes);

// --- Financial & Ledger Routes ---
router.use('/budgets', budgetRoutes);
router.use('/budget-templates', budgetTemplateRoutes);
router.use('/accounts', accountRoutes);
router.use('/transactions', transactionRoutes);
router.use('/invoices', invoiceRoutes);
router.use('/payments', paymentRoutes);
router.use('/expenses', expenseRoutes);
router.use('/project-ledger', projectLedgerRoutes);
router.use('/general-ledger', generalLedgerRoutes);
router.use('/integrated-finance', integratedFinanceRoutes);
router.use('/period-closing', periodClosingRoutes);
router.use('/bank-reconciliation', bankReconciliationRoutes);
router.use('/recurring-entries', recurringEntryRoutes);
router.use('/vouchers', voucherRoutes);
router.use('/advanced-reports', advancedReportRoutes);
router.use('/finance-advanced', financeAdvancedRoutes);
router.use('/bills', billsRoutes);
router.use('/cost-centers', costCenterRoutes);
router.use('/chart-of-accounts', chartOfAccountsRoutes);
router.use('/gl-budgets', glBudgetRoutes);
router.use('/interest-calculations', interestCalculationRoutes);
router.use('/invoices-enhanced', invoiceEnhancedRoutes);
router.use('/journal-enhanced', journalEnhancedRoutes);
router.use('/invoice-templates', invoiceTemplateRoutes);
router.use('/journal-templates', journalTemplateRoutes);
router.use('/allocation-rules', allocationRuleRoutes);
router.use('/invoices-new', invoiceNewRoutes);
router.use('/journal-entries', journalEntryRoutes);
router.use('/invoice-templates-new', invoiceTemplateNewRoutes);
router.use('/journal-entry-templates', journalEntryTemplateRoutes);
router.use('/project-finance', projectFinanceEnhanced);
router.use('/financial-reports', financialReportRoutes);
router.use('/financial-reports-enhanced', financialReportsEnhanced);
// Indian accounts merged into general-ledger

// --- Health Check Endpoints ---
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'API is working',
    timestamp: new Date().toISOString()
  });
});

// Socket health check
router.get('/socket-health', (req, res) => {
  res.json({
    success: true,
    message: 'Socket server is running',
    socketConnected: true,
    timestamp: new Date().toISOString()
  });
});

export default router;