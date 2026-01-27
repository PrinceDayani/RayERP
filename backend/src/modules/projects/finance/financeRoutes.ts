import { Router } from 'express';
import {
  getBurndownChart,
  getVelocity,
  getResourceUtilization,
  getPerformanceIndices,
  getRiskAssessment
} from './financeController';
import { validateObjectId } from '../../../middleware/validation.middleware';
import { checkProjectAccess } from '../../../middleware/projectAccess.middleware';
import budgetRoutes from '../../../routes/budgetRoutes';

const router = Router({ mergeParams: true });

// Analytics routes
router.get('/analytics/burndown', validateObjectId('id'), checkProjectAccess, getBurndownChart);
router.get('/analytics/velocity', validateObjectId('id'), checkProjectAccess, getVelocity);
router.get('/analytics/resource-utilization', validateObjectId('id'), checkProjectAccess, getResourceUtilization);
router.get('/analytics/performance-indices', validateObjectId('id'), checkProjectAccess, getPerformanceIndices);
router.get('/analytics/risk-assessment', validateObjectId('id'), checkProjectAccess, getRiskAssessment);

// Budget routes
router.use('/budget', budgetRoutes);

export default router;
