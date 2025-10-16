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
import projectLedgerRoutes from './projectLedger.routes';
import generalLedgerRoutes from './generalLedger.routes';



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
router.use('/project-ledger', projectLedgerRoutes); // Add project ledger routes
router.use('/general-ledger', generalLedgerRoutes); // Add General Ledger routes



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

// Debug: Create test user
router.post('/create-test-user', async (req, res) => {
  try {
    const User = (await import('../models/User')).default;
    
    const existingUser = await User.findOne({ email: 'test@test.test' });
    if (existingUser) {
      return res.json({ 
        message: 'Test user already exists',
        email: 'test@test.test',
        password: '101010'
      });
    }
    
    const testUser = await User.create({
      name: 'Test User',
      email: 'test@test.test',
      password: '101010',
      role: 'admin'
    });
    
    res.json({
      message: 'Test user created',
      email: 'test@test.test',
      password: '101010'
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Debug: List users
router.get('/list-users', async (req, res) => {
  try {
    const User = (await import('../models/User')).default;
    const users = await User.find({}, 'name email role');
    res.json({ users, count: users.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Debug: Clear all users (for testing initial setup)
router.delete('/clear-users', async (req, res) => {
  try {
    const User = (await import('../models/User')).default;
    await User.deleteMany({});
    res.json({ message: 'All users cleared' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});



export default router
