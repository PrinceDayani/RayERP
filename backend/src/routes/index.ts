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
import adminRoutes from './admin.routes';
import leaveRoutes from './leave.routes';
import employeeReportRoutes from './employeeReport.routes';
import activityRoutes from './activity.routes';
import rbacRoutes from './rbac.routes';
import projectTemplateRoutes from './projectTemplate.routes';
import resourceRoutes from './resourceRoutes';
import departmentRoutes from './department.routes';
import onboardingRoutes from './onboarding.routes';
import fileShareRoutes from './fileShare.routes';
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
router.use('/admin', adminRoutes);
router.use('/leaves', leaveRoutes);
router.use('/employee-reports', employeeReportRoutes);
router.use('/activities', activityRoutes);
router.use('/rbac', rbacRoutes);
router.use('/project-templates', projectTemplateRoutes);
router.use('/resources', resourceRoutes);
router.use('/departments', departmentRoutes);
router.use('/onboarding', onboardingRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/file-shares', fileShareRoutes);

// --- Financial & Ledger Routes ---
router.use('/budgets', budgetRoutes);
router.use('/budget-templates', budgetTemplateRoutes);
router.use('/accounts', accountRoutes);
router.use('/transactions', transactionRoutes);
router.use('/invoices', invoiceRoutes);
router.use('/payments', paymentRoutes);
router.use('/expenses', expenseRoutes);
router.use('/financial-reports', financialReportRoutes);
router.use('/project-ledger', projectLedgerRoutes);
router.use('/general-ledger', generalLedgerRoutes);
router.use('/integrated-finance', integratedFinanceRoutes);

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