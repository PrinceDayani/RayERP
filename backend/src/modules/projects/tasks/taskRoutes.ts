import { Router } from 'express';
import {
  getProjectTasks,
  createProjectTask,
  updateProjectTask,
  deleteProjectTask,
  reorderTasks
} from './taskController';
import { validateObjectId, validateRequiredFields } from '../../../middleware/validation.middleware';
import { checkProjectAccess } from '../../../middleware/projectAccess.middleware';

const router = Router({ mergeParams: true });

router.get('/', validateObjectId('id'), checkProjectAccess, getProjectTasks);
router.post('/',
  validateObjectId('id'),
  checkProjectAccess,
  validateRequiredFields(['title', 'assignedTo', 'assignedBy']),
  createProjectTask
);
router.put('/:taskId',
  validateObjectId('id'),
  validateObjectId('taskId'),
  checkProjectAccess,
  updateProjectTask
);
router.delete('/:taskId',
  validateObjectId('id'),
  validateObjectId('taskId'),
  checkProjectAccess,
  deleteProjectTask
);
router.post('/reorder',
  validateObjectId('id'),
  checkProjectAccess,
  validateRequiredFields(['tasks']),
  reorderTasks
);

export default router;
