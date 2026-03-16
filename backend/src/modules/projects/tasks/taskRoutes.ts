import { Router } from 'express';
import {
  getProjectTasks,
  createProjectTask,
  updateProjectTask,
  deleteProjectTask,
  reorderTasks,
  addProjectTaskComment,
  startProjectTaskTimer,
  stopProjectTaskTimer,
  addProjectTaskTag,
  removeProjectTaskTag,
  addProjectTaskAttachment,
  removeProjectTaskAttachment,
  addProjectTaskChecklist,
  updateProjectTaskChecklist,
  deleteProjectTaskChecklist,
  addProjectTaskWatcher,
  removeProjectTaskWatcher,
  addProjectTaskSubtask,
  deleteProjectTaskSubtask,
  getProjectTaskSubtaskProgress,
  addProjectTaskDependency,
  removeProjectTaskDependency,
  updateProjectTaskStatus,
  cloneProjectTask,
  getProjectTaskTimeline
} from './taskController';
import { validateObjectId, validateRequiredFields } from '../../../middleware/validation.middleware';
import { checkProjectAccess } from '../../../middleware/projectAccess.middleware';
import { upload } from '../../../middleware/upload.middleware';

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

// Comments
router.post('/:taskId/comments',
  validateObjectId('taskId'),
  checkProjectAccess,
  validateRequiredFields(['comment', 'user']),
  addProjectTaskComment
);

// Time Tracking
router.post('/:taskId/time/start',
  validateObjectId('taskId'),
  checkProjectAccess,
  validateRequiredFields(['user']),
  startProjectTaskTimer
);
router.post('/:taskId/time/stop',
  validateObjectId('taskId'),
  checkProjectAccess,
  validateRequiredFields(['user']),
  stopProjectTaskTimer
);

// Tags
router.post('/:taskId/tags',
  validateObjectId('taskId'),
  checkProjectAccess,
  validateRequiredFields(['name']),
  addProjectTaskTag
);
router.delete('/:taskId/tags',
  validateObjectId('taskId'),
  checkProjectAccess,
  validateRequiredFields(['name']),
  removeProjectTaskTag
);

// Attachments
router.post('/:taskId/attachments',
  validateObjectId('taskId'),
  checkProjectAccess,
  upload.single('file'),
  addProjectTaskAttachment
);
router.delete('/:taskId/attachments/:attachmentId',
  validateObjectId('taskId'),
  validateObjectId('attachmentId'),
  checkProjectAccess,
  removeProjectTaskAttachment
);

// Checklist
router.post('/:taskId/checklist',
  validateObjectId('taskId'),
  checkProjectAccess,
  validateRequiredFields(['text']),
  addProjectTaskChecklist
);
router.patch('/:taskId/checklist/:itemId',
  validateObjectId('taskId'),
  validateObjectId('itemId'),
  checkProjectAccess,
  updateProjectTaskChecklist
);
router.delete('/:taskId/checklist/:itemId',
  validateObjectId('taskId'),
  validateObjectId('itemId'),
  checkProjectAccess,
  deleteProjectTaskChecklist
);

// Watchers
router.post('/:taskId/watchers',
  validateObjectId('taskId'),
  checkProjectAccess,
  validateRequiredFields(['userId']),
  addProjectTaskWatcher
);
router.delete('/:taskId/watchers',
  validateObjectId('taskId'),
  checkProjectAccess,
  validateRequiredFields(['userId']),
  removeProjectTaskWatcher
);

// Subtasks
router.post('/:taskId/subtasks',
  validateObjectId('taskId'),
  checkProjectAccess,
  validateRequiredFields(['title', 'description', 'assignedTo', 'assignedBy']),
  addProjectTaskSubtask
);
router.delete('/:taskId/subtasks/:subtaskId',
  validateObjectId('taskId'),
  validateObjectId('subtaskId'),
  checkProjectAccess,
  deleteProjectTaskSubtask
);
router.get('/:taskId/subtasks/progress',
  validateObjectId('taskId'),
  checkProjectAccess,
  getProjectTaskSubtaskProgress
);

// Dependencies
router.post('/:taskId/dependencies',
  validateObjectId('taskId'),
  checkProjectAccess,
  validateRequiredFields(['dependsOn']),
  addProjectTaskDependency
);
router.delete('/:taskId/dependencies/:dependencyId',
  validateObjectId('taskId'),
  validateObjectId('dependencyId'),
  checkProjectAccess,
  removeProjectTaskDependency
);

// Status & Actions
router.patch('/:taskId/status',
  validateObjectId('taskId'),
  checkProjectAccess,
  validateRequiredFields(['status']),
  updateProjectTaskStatus
);
router.post('/:taskId/clone',
  validateObjectId('taskId'),
  checkProjectAccess,
  cloneProjectTask
);

// Timeline
router.get('/:taskId/timeline',
  validateObjectId('taskId'),
  checkProjectAccess,
  getProjectTaskTimeline
);

export default router;
