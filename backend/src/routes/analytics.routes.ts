// src/routes/analytics.routes.ts
import express from 'express';
import analyticsController from '../controllers/analyticsController';
import { protect } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/rbac.middleware';

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);

// Get dashboard analytics data - requires analytics.view permission
router.get('/dashboard', requirePermission('analytics.view'), analyticsController.getDashboardAnalytics);

// Add stats endpoint as alias for dashboard
router.get('/stats', requirePermission('analytics.view'), analyticsController.getDashboardAnalytics);

// Get productivity trends
router.get('/productivity-trends', requirePermission('analytics.view'), analyticsController.getProductivityTrends);

// Get project dues and deadlines
router.get('/project-dues', requirePermission('analytics.view'), analyticsController.getProjectDues);

// Get top performing employees
router.get('/top-performers', requirePermission('analytics.view'), analyticsController.getTopPerformers);

// Get budget analytics
router.get('/budget-analytics', requirePermission('analytics.view'), analyticsController.getBudgetAnalytics);

export default router;