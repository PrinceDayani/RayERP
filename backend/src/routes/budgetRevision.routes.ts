import express from 'express';
import {
  createRevision,
  getBudgetVersions,
  compareVersions,
  restoreVersion,
  getRevisionHistory
} from '../controllers/budgetRevisionController';
import { requirePermission } from '../middleware/budgetAuth';

const router = express.Router();
const { authenticateToken } = require('../middleware/auth.middleware');

router.use(authenticateToken);

// Revision routes
router.post('/:budgetId/revise', requirePermission('budgets.edit'), createRevision);
router.get('/:budgetId/versions', requirePermission('budgets.view'), getBudgetVersions);
router.get('/:budgetId/compare/:versionId', requirePermission('budgets.view'), compareVersions);
router.post('/:budgetId/restore/:versionId', requirePermission('budgets.edit'), restoreVersion);
router.get('/:budgetId/history', requirePermission('budgets.view'), getRevisionHistory);

export default router;
