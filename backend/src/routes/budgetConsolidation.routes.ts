import express from 'express';
import { getConsolidatedView, createMasterBudget } from '../controllers/budgetConsolidationController';
import { protect } from '../middleware/auth.middleware';

const router = express.Router();

router.get('/consolidation', protect, getConsolidatedView);
router.post('/master-budget', protect, createMasterBudget);

export default router;
