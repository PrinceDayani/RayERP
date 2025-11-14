import express from 'express';
import * as controller from '../controllers/financeAdvancedController';
import { protect } from '../middleware/auth.middleware';

const router = express.Router();

// Multi-Currency
router.get('/currencies', protect, controller.getCurrencies);
router.post('/currencies', protect, controller.createCurrency);
router.get('/exchange-rates', protect, controller.getExchangeRates);
router.post('/exchange-rates', protect, controller.createExchangeRate);

// Tax Management
router.get('/taxes', protect, controller.getTaxConfigs);
router.post('/taxes', protect, controller.createTaxConfig);

// Aging Analysis
router.get('/aging-analysis', protect, controller.getAgingAnalysis);

// Year-End Closing
router.get('/financial-years', protect, controller.getFinancialYears);
router.post('/financial-years/close', protect, controller.closeFinancialYear);

// Audit Trail
router.get('/audit-logs', protect, controller.getAuditLogs);

// Approval Workflows
router.get('/approvals', protect, controller.getApprovals);
router.post('/approvals', protect, controller.createApproval);
router.put('/approvals/:id', protect, controller.updateApprovalStatus);

// Document Manager
router.get('/documents', protect, controller.getDocuments);
router.post('/documents', protect, controller.uploadDocument);

// Smart Alerts
router.get('/alerts', protect, controller.getAlerts);
router.put('/alerts/:id/resolve', protect, controller.resolveAlert);
router.get('/alerts/detect-duplicates', protect, controller.detectDuplicates);
router.post('/alerts/auto-detect', protect, controller.autoDetectAnomalies);

// Financial Year
router.post('/financial-years', protect, controller.createFinancialYear);

export default router;
