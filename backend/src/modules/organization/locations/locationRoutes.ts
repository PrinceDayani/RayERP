import { Router } from 'express';
import { protect } from '../../../middleware/auth.middleware';
import { requirePermission } from '../../../middleware/rbac.middleware';
import { validateCsrfToken } from '../../../middleware/csrf.middleware';
import { listLocations, createLocation, updateLocation, deleteLocation } from './locationController';

const router = Router();

router.use(protect);

// Offices, branches and sites; readable by everyone (employee forms pick from them).
router.get('/', listLocations);

// Add, edit and remove locations.
router.post('/', requirePermission('organization.manage'), validateCsrfToken, createLocation);
router.put('/:id', requirePermission('organization.manage'), validateCsrfToken, updateLocation);
router.delete('/:id', requirePermission('organization.manage'), validateCsrfToken, deleteLocation);

export default router;
