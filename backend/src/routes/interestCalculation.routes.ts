import express from 'express';
import * as interestController from '../controllers/interestCalculationController';
import { protect } from '../middleware/auth.middleware';

const router = express.Router();

router.use(protect);

router.post('/', interestController.createCalculation);
router.get('/', interestController.getCalculations);
router.get('/summary', interestController.getSummary);
router.get('/accruals', interestController.getAccruals);
router.get('/overdue', interestController.getOverdueCalculations);
router.get('/:id', interestController.getCalculationById);
router.delete('/:id', interestController.deleteCalculation);

router.post('/:id/post', interestController.postCalculation);
router.put('/:id/emi-status', interestController.updateEMIStatus);

router.post('/schedule', interestController.scheduleAutoCalculation);
router.post('/run-scheduled', interestController.runScheduledCalculations);

export default router;
