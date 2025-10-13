// src/routes/analytics.routes.ts
import express from 'express';
import analyticsController from '../controllers/analyticsController';
import { protect } from '../middleware/auth.middleware';

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);

// Get dashboard analytics data
router.get('/dashboard', analyticsController.getDashboardAnalytics);

// Add stats endpoint as alias for dashboard
router.get('/stats', analyticsController.getDashboardAnalytics);

export default router;