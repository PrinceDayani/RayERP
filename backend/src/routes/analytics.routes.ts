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

export default router;