import express from 'express';
import { protect } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/permission.middleware';
import { validateCsrfToken } from '../middleware/csrf.middleware';
import { getSecurityPolicy, updateSecurityPolicy } from '../controllers/securityPolicyController';

const router = express.Router();

// Read the organisation password / lockout / session policy.
router.get('/', protect, requirePermission('settings.view'), getSecurityPolicy);

// Change the policy. Applies to every account, so it is administrator-only.
router.put('/', protect, requirePermission('settings.edit'), validateCsrfToken, updateSecurityPolicy);

export default router;
