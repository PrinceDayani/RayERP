//project\backend\src\routes\index.ts
import authRoutes from "./auth.routes"
import userRoutes from "./user.routes"
import employeeRoutes from "./employee.routes"
import projectRoutes from "./project.routes"
import taskRoutes from "./task.routes"
import attendanceRoutes from "./attendance.routes"
import reportRoutes from './report.routes';
import express from 'express';
import contactRoutes from './contact.routes';
import analyticsRoutes from './analytics.routes'; // Add this line
import settingsRoutes from './settings.routes';
import adminRoutes from './admin.routes';
import leaveRoutes from './leave.routes';
import employeeReportRoutes from './employeeReport.routes';
import activityRoutes from './activity.routes';
import rbacRoutes from './rbac.routes';
import budgetRoutes from './budgetRoutes';
import budgetTemplateRoutes from './budgetTemplateRoutes';
import accountRoutes from './account.routes';
import transactionRoutes from './transaction.routes';
import invoiceRoutes from './invoice.routes';
import paymentRoutes from './payment.routes';
import expenseRoutes from './expense.routes';
import financialReportRoutes from './financialReport.routes';



const router = express.Router();

router.use("/auth", authRoutes)
router.use("/users", userRoutes)
router.use("/employees", employeeRoutes)
router.use("/projects", projectRoutes)
router.use("/tasks", taskRoutes)
router.use("/attendance", attendanceRoutes)
router.use("/reports", reportRoutes)
router.use('/contacts', contactRoutes); // Register contact routes
router.use('/analytics', analyticsRoutes); // Add this line
router.use('/settings', settingsRoutes); // Add settings routes
router.use('/admin', adminRoutes); // Add admin routes
router.use('/leaves', leaveRoutes); // Add leave routes
router.use('/employee-reports', employeeReportRoutes); // Add employee report routes
router.use('/activity', activityRoutes); // Add activity routes
router.use('/rbac', rbacRoutes); // Add RBAC routes
router.use('/budgets', budgetRoutes); // Add budget routes
router.use('/budget-templates', budgetTemplateRoutes); // Add budget template routes
router.use('/accounts', accountRoutes); // Add account routes
router.use('/transactions', transactionRoutes); // Add transaction routes
router.use('/invoices', invoiceRoutes); // Add invoice routes
router.use('/payments', paymentRoutes); // Add payment routes
router.use('/expenses', expenseRoutes); // Add expense routes
router.use('/financial-reports', financialReportRoutes); // Add financial report routes



// Health check endpoint
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





export default router
