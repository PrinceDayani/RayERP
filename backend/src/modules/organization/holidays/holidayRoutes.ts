import { Router } from 'express';
import { protect } from '../../../middleware/auth.middleware';
import { requirePermission } from '../../../middleware/rbac.middleware';
import { validateCsrfToken } from '../../../middleware/csrf.middleware';
import { listHolidays, createHoliday, updateHoliday, deleteHoliday, copyHolidays } from './holidayController';

const router = Router();

router.use(protect);

// Holiday calendar for a year; readable by everyone.
router.get('/', listHolidays);

// Copy one year's holidays into another.
router.post('/copy', requirePermission('organization.manage'), validateCsrfToken, copyHolidays);

// Add, edit and remove holidays.
router.post('/', requirePermission('organization.manage'), validateCsrfToken, createHoliday);
router.put('/:id', requirePermission('organization.manage'), validateCsrfToken, updateHoliday);
router.delete('/:id', requirePermission('organization.manage'), validateCsrfToken, deleteHoliday);

export default router;
