import express from 'express';
import * as glBudgetController from '../controllers/glBudgetController';
import { protect } from '../middleware/auth.middleware';

const router = express.Router();

router.use(protect);

router.post('/', glBudgetController.createBudget);
router.get('/', glBudgetController.getBudgets);
router.get('/alerts', glBudgetController.getAlerts);
router.get('/comparison', glBudgetController.getComparison);
router.get('/:id', glBudgetController.getBudgetById);
router.put('/:id', glBudgetController.updateBudget);
router.delete('/:id', glBudgetController.deleteBudget);

router.post('/:id/revise', glBudgetController.reviseBudget);
router.post('/:id/submit-approval', glBudgetController.submitForApproval);
router.post('/:id/approve', glBudgetController.approveBudget);
router.post('/:id/reject', glBudgetController.rejectBudget);
router.post('/:id/freeze', glBudgetController.freezeBudget);
router.put('/:id/actuals', glBudgetController.updateActuals);

router.post('/from-template', glBudgetController.createFromTemplate);
router.post('/copy-previous-year', glBudgetController.copyFromPreviousYear);

export default router;
