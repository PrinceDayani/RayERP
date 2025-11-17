import express from 'express';
import { uploadBankStatement, startReconciliation, completeReconciliation, getReconciliations, getBankStatements } from '../controllers/bankReconciliationController';
import { protect } from '../middleware/auth.middleware';

const router = express.Router();

router.use(protect);

router.post('/statements', uploadBankStatement);
router.get('/statements', getBankStatements);
router.post('/statements/:statementId/reconcile', startReconciliation);
router.put('/reconciliations/:id/complete', completeReconciliation);
router.get('/reconciliations', getReconciliations);

export default router;
