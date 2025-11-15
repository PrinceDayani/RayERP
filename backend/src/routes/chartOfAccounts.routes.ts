import express from 'express';
import * as coaController from '../controllers/chartOfAccountsController';
import { authenticateToken } from '../middleware/auth.middleware';

const router = express.Router();

router.use(authenticateToken);

// Templates
router.get('/templates', coaController.getTemplates);
router.post('/templates/:templateId/apply', coaController.applyTemplate);

// Mappings
router.post('/mappings', coaController.createMapping);
router.get('/mappings', coaController.getMappings);

// Opening Balances
router.post('/opening-balances', coaController.setOpeningBalance);
router.get('/opening-balances', coaController.getOpeningBalances);

// Bulk Operations
router.post('/bulk-import', coaController.bulkImportAccounts);
router.get('/export', coaController.exportAccounts);

// Account Restrictions
router.put('/:accountId/restriction', coaController.setAccountRestriction);

// Consolidation
router.get('/consolidation', coaController.getConsolidationReport);

// Reconciliation
router.put('/:accountId/reconciliation', coaController.updateReconciliationStatus);
router.get('/reconciliation', coaController.getReconciliationReport);

export default router;
