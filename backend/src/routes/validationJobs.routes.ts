import express from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/rbac.middleware';
import { getValidationReports, runAllValidationJobs } from '../jobs/validationJobs';

const router = express.Router();

router.use(authenticateToken);

/**
 * Get validation job reports
 */
router.get('/reports', requirePermission('admin.view'), (req, res) => {
    try {
        const limit = parseInt(req.query.limit as string) || 10;
        const reports = getValidationReports(limit);

        res.json({
            success: true,
            data: reports
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * Manually trigger all validation jobs
 */
router.post('/run', requirePermission('admin.execute'), async (req, res) => {
    try {
        await runAllValidationJobs();

        res.json({
            success: true,
            message: 'All validation jobs triggered successfully'
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

export default router;
