import { Router } from 'express';
import { protect } from '../../../middleware/auth.middleware';
import { requirePermission } from '../../../middleware/rbac.middleware';
import { validateCsrfToken } from '../../../middleware/csrf.middleware';
import { getLeavePolicy, updateLeavePolicy } from './leavePolicyController';

const router = Router();

router.use(protect);

// Leave quotas and counting rules; readable by everyone.
router.get('/', getLeavePolicy);

// Change quotas, carry-forward and whether weekly offs / holidays count.
router.put('/', requirePermission('organization.manage'), validateCsrfToken, updateLeavePolicy);

export default router;
