import express from 'express';
import * as coaController from '../controllers/chartOfAccountsController';
import { authenticateToken } from '../middleware/auth.middleware';
import { requireFinanceAccess } from '../middleware/financePermission.middleware';
import * as accountController from '../controllers/accountController';

const router = express.Router();

router.use(authenticateToken);

// Basic CRUD operations
router.get('/', requireFinanceAccess('accounts.view'), accountController.getAccounts);
router.post('/', requireFinanceAccess('accounts.create'), accountController.createAccount);
router.get('/:id', requireFinanceAccess('accounts.view'), accountController.getAccountById);
router.put('/:id', requireFinanceAccess('accounts.edit'), accountController.updateAccount);
router.delete('/:id', requireFinanceAccess('accounts.delete'), accountController.deleteAccount);

// Templates
router.get('/templates', requireFinanceAccess('accounts.view'), coaController.getTemplates);
router.post('/templates/:templateId/apply', requireFinanceAccess('accounts.create'), coaController.applyTemplate);

// Mappings
router.post('/mappings', requireFinanceAccess('accounts.create'), coaController.createMapping);
router.get('/mappings', requireFinanceAccess('accounts.view'), coaController.getMappings);

// Opening Balances
router.post('/opening-balances', requireFinanceAccess('accounts.edit'), coaController.setOpeningBalance);
router.get('/opening-balances', requireFinanceAccess('accounts.view'), coaController.getOpeningBalances);

// Bulk Operations
router.post('/bulk-import', requireFinanceAccess('accounts.create'), coaController.bulkImportAccounts);
router.get('/export', requireFinanceAccess('accounts.view'), coaController.exportAccounts);

// Account Restrictions
router.put('/:accountId/restriction', requireFinanceAccess('accounts.edit'), coaController.setAccountRestriction);

// Consolidation
router.get('/consolidation', requireFinanceAccess('accounts.view'), coaController.getConsolidationReport);

// Reconciliation
router.put('/:accountId/reconciliation', requireFinanceAccess('accounts.edit'), coaController.updateReconciliationStatus);
router.get('/reconciliation', requireFinanceAccess('accounts.view'), coaController.getReconciliationReport);

export default router;
