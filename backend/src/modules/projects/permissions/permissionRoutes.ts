import { Router } from 'express';
import {
  getProjectPermissions,
  setProjectPermissions,
  removeProjectPermissions,
  getEmployeeProjectPermissions
} from './permissionController';
import { validateObjectId, validateRequiredFields } from '../../../middleware/validation.middleware';
import { checkProjectAccess } from '../../../middleware/projectAccess.middleware';
import { requireProjectPermission } from '../../../middleware/projectPermission.middleware';

const router = Router({ mergeParams: true });

router.get('/', validateObjectId('id'), checkProjectAccess, getProjectPermissions);
router.post('/',
  validateObjectId('id'),
  requireProjectPermission('projects.manage_team', true),
  validateRequiredFields(['employeeId', 'permissions']),
  setProjectPermissions
);
router.get('/:employeeId',
  validateObjectId('id'),
  validateObjectId('employeeId'),
  checkProjectAccess,
  getEmployeeProjectPermissions
);
router.delete('/:employeeId',
  validateObjectId('id'),
  validateObjectId('employeeId'),
  requireProjectPermission('projects.manage_team', true),
  removeProjectPermissions
);

export default router;
