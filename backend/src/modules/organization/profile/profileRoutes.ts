import { Router } from 'express';
import { protect } from '../../../middleware/auth.middleware';
import { requirePermission } from '../../../middleware/rbac.middleware';
import { validateCsrfToken } from '../../../middleware/csrf.middleware';
import { getProfile, updateProfile } from './profileController';

const router = Router();

router.use(protect);

// Company identity. Every signed-in user can read it (name and logo appear across the app).
router.get('/', getProfile);

// Update company identity, fiscal year and base currency.
router.put('/', requirePermission('organization.manage'), validateCsrfToken, updateProfile);

export default router;
