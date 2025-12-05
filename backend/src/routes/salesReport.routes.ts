import { Router } from 'express';
import { getSalesReport, getSalesSummary, getTopCustomers, getSalesTrends } from '../controllers/salesReportController';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.get('/report', protect, getSalesReport);
router.get('/summary', protect, getSalesSummary);
router.get('/top-customers', protect, getTopCustomers);
router.get('/trends', protect, getSalesTrends);

export default router;
