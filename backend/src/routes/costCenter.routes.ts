import express from 'express';
import * as costCenterController from '../controllers/costCenterController';
import { protect } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/rbac.middleware';

const router = express.Router();

router.use(protect);

router.post('/', requirePermission('finance:create'), costCenterController.createCostCenter);
router.get('/', requirePermission('finance:read'), costCenterController.getCostCenters);
router.get('/:id', requirePermission('finance:read'), costCenterController.getCostCenterById);
router.put('/:id', requirePermission('finance:update'), costCenterController.updateCostCenter);
router.delete('/:id', requirePermission('finance:delete'), costCenterController.deleteCostCenter);

router.post('/allocate', requirePermission('finance:create'), costCenterController.allocateCosts);
router.post('/transfer', requirePermission('finance:create'), costCenterController.transferCosts);
router.get('/reports/profitability', requirePermission('finance:read'), costCenterController.getProfitabilityReport);
router.get('/reports/variance', requirePermission('finance:read'), costCenterController.getVarianceAnalysis);

router.post('/bulk-import', requirePermission('finance:create'), costCenterController.bulkImport);
router.get('/export/csv', requirePermission('finance:read'), costCenterController.exportCostCenters);

export default router;
