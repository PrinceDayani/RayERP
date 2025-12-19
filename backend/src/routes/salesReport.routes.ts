import { Router } from 'express';
import { getSalesReport, getSalesSummary, getTopCustomers, getSalesTrends, getMonthlyTrends } from '../controllers/salesReportController';
import { protect } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/permission.middleware';
import { apiLimiter } from '../middleware/rateLimiter.middleware';
import { query } from 'express-validator';

const router = Router();

router.use(apiLimiter);

router.get('/report', 
  protect, 
  requirePermission('sales.view'),
  [
    query('status').optional().isString(),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('customerId').optional().isString()
  ],
  getSalesReport
);

router.get('/summary', protect, requirePermission('sales.view'), getSalesSummary);
router.get('/top-customers', protect, requirePermission('sales.view'), getTopCustomers);
router.get('/trends', protect, requirePermission('sales.view'), getSalesTrends);
router.get('/monthly-trends', protect, requirePermission('sales.view'), getMonthlyTrends);

export default router;
