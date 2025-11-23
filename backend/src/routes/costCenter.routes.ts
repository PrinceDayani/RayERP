import express from 'express';
import * as costCenterController from '../controllers/costCenterController';
import { protect } from '../middleware/auth.middleware';

const router = express.Router();

router.use(protect);

router.post('/', costCenterController.createCostCenter);
router.get('/', costCenterController.getCostCenters);
router.get('/:id', costCenterController.getCostCenterById);
router.put('/:id', costCenterController.updateCostCenter);
router.delete('/:id', costCenterController.deleteCostCenter);

router.post('/allocate', costCenterController.allocateCosts);
router.post('/transfer', costCenterController.transferCosts);
router.get('/reports/profitability', costCenterController.getProfitabilityReport);
router.get('/reports/variance', costCenterController.getVarianceAnalysis);

router.post('/bulk-import', costCenterController.bulkImport);
router.get('/export/csv', costCenterController.exportCostCenters);

export default router;
