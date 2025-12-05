// src/routes/analytics.routes.ts
import express from 'express';
import analyticsController from '../controllers/analyticsController';
import { protect } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/rbac.middleware';

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);

// Dashboard analytics
router.get('/dashboard', requirePermission('analytics.view'), analyticsController.getDashboardAnalytics);
router.get('/stats', requirePermission('analytics.view'), analyticsController.getDashboardAnalytics);

// Financial analytics
router.get('/financial', requirePermission('analytics.financial'), analyticsController.getDashboardAnalytics);
router.get('/financial/revenue', requirePermission('analytics.financial'), analyticsController.getDashboardAnalytics);
router.get('/financial/expenses', requirePermission('analytics.financial'), analyticsController.getDashboardAnalytics);

// Sales analytics
router.get('/sales', requirePermission('analytics.sales'), analyticsController.getDashboardAnalytics);
router.get('/sales/trends', requirePermission('analytics.sales'), analyticsController.getDashboardAnalytics);

// Inventory analytics
router.get('/inventory', requirePermission('analytics.inventory'), analyticsController.getDashboardAnalytics);
router.get('/inventory/stock', requirePermission('analytics.inventory'), analyticsController.getDashboardAnalytics);

// General analytics
router.get('/productivity-trends', requirePermission('analytics.view'), analyticsController.getProductivityTrends);
router.get('/project-dues', requirePermission('analytics.view'), analyticsController.getProjectDues);
router.get('/top-performers', requirePermission('analytics.view'), analyticsController.getTopPerformers);
router.get('/budget-analytics', requirePermission('analytics.financial'), analyticsController.getBudgetAnalytics);

export default router;