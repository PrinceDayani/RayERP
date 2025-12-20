import express from 'express';
import { protect } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/permission.middleware';
import { apiLimiter, strictLimiter } from '../middleware/rateLimiter.middleware';
import { query, body } from 'express-validator';
import { getAuditLogs, getAuditStats, getAuditLogById, createAuditLog, getSecurityEvents, getSecurityAlerts, exportAuditLogs, getComplianceMetrics, cleanupOldLogs } from '../controllers/auditTrailController';

const router = express.Router();

router.use(apiLimiter);

// Audit Trail Routes

router.get('/',
  protect,
  requirePermission('audit.view'),
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('module').optional().isString(),
    query('action').optional().isIn(['CREATE', 'UPDATE', 'DELETE', 'VIEW', 'LOGIN', 'LOGOUT']),
    query('user').optional().isString(),
    query('ipAddress').optional().isString(),
    query('status').optional().isIn(['Success', 'Failed', 'Warning']),
    query('riskLevel').optional().isIn(['Low', 'Medium', 'High', 'Critical']),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601()
  ],
  getAuditLogs
);

router.get('/stats', protect, requirePermission('audit.view'), getAuditStats);

router.get('/export', protect, requirePermission('audit.view'), exportAuditLogs);

router.get('/compliance/metrics', protect, requirePermission('audit.view'), getComplianceMetrics);

router.delete('/cleanup', protect, requirePermission('audit.manage'), cleanupOldLogs);

router.get('/:id', protect, requirePermission('audit.view'), getAuditLogById);





router.get('/security/events', protect, requirePermission('audit.view'), getSecurityEvents);

router.get('/security/alerts', protect, requirePermission('audit.view'), getSecurityAlerts);

router.post('/log',
  protect,
  strictLimiter,
  [
    body('action').notEmpty().isIn(['CREATE', 'UPDATE', 'DELETE', 'VIEW', 'LOGIN', 'LOGOUT']),
    body('module').notEmpty().isString().trim().escape(),
    body('recordId').optional().isString().trim().escape(),
    body('oldValue').optional().isString().trim(),
    body('newValue').optional().isString().trim()
  ],
  createAuditLog
);

export default router;