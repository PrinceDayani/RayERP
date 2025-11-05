//path: backend/src/routes/task.routes.ts
import { Router } from 'express';
import {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  addTaskComment,
  getTaskTimeline,
  addTimelineEntry,
  updateTaskStatus,
  cloneTask,
  bulkUpdateTasks,
  addWatcher,
  removeWatcher,
  getTaskTemplates,
  createFromTemplate
} from '../controllers/taskController';
import { authenticateToken } from '../middleware/auth.middleware';
import {
  validateObjectId,
  validateRequiredFields,
  validateTaskStatus,
  validatePriority
} from '../middleware/validation.middleware';

const router = Router();

router.use(authenticateToken);

// Stats route must come before parameterized routes
router.get('/stats', async (req, res) => {
  try {
    const { getTaskStats } = await import('../utils/taskUtils');
    const stats = await getTaskStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching task stats', error });
  }
});

router.get('/', getAllTasks);
router.get('/:id', validateObjectId(), getTaskById);
router.post('/', 
  validateRequiredFields(['title', 'description', 'project', 'assignedTo', 'assignedBy']),
  validateTaskStatus,
  validatePriority,
  createTask
);
router.put('/:id', 
  validateObjectId(),
  validateTaskStatus,
  validatePriority,
  updateTask
);
router.delete('/:id', validateObjectId(), deleteTask);
router.post('/:id/comments', 
  validateObjectId(),
  validateRequiredFields(['comment', 'user']),
  addTaskComment
);
router.get('/:id/timeline', validateObjectId(), getTaskTimeline);
router.post('/:id/timeline', 
  validateObjectId(),
  validateRequiredFields(['type', 'description', 'user']),
  addTimelineEntry
);
router.patch('/:id/status', 
  validateObjectId(),
  validateRequiredFields(['status']),
  validateTaskStatus,
  updateTaskStatus
);

router.post('/:id/clone', validateObjectId(), cloneTask);
router.patch('/bulk', validateRequiredFields(['taskIds', 'updates']), bulkUpdateTasks);
router.post('/:id/watchers', validateObjectId(), validateRequiredFields(['userId']), addWatcher);
router.delete('/:id/watchers', validateObjectId(), validateRequiredFields(['userId']), removeWatcher);
router.get('/templates/all', getTaskTemplates);
router.post('/templates/:id/create', validateObjectId(), createFromTemplate);

export default router;