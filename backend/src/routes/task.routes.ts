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
  createFromTemplate,
  startTimeTracking,
  stopTimeTracking,
  addAttachment,
  removeAttachment,
  addTag,
  removeTag
} from '../controllers/taskController';
import {
  addSubtask,
  addChecklistItem,
  updateChecklistItem,
  getSubtaskProgress,
  deleteChecklistItem,
  deleteSubtask
} from '../controllers/taskSubtaskController';
import {
  addDependency,
  removeDependency,
  getDependencyGraph,
  getCriticalPath,
  checkBlockedTasks
} from '../controllers/taskDependencyController';
import { setRecurring } from '../controllers/taskRecurringController';
import {
  advancedSearch,
  saveSearch,
  getSavedSearches,
  deleteSavedSearch,
  getSearchSuggestions
} from '../controllers/taskSearchController';
import {
  getCalendarView,
  getTimelineView,
  exportICalendar,
  syncGoogleCalendar
} from '../controllers/taskCalendarController';
import { authenticateToken } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';
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

router.post('/:id/time/start', validateObjectId(), validateRequiredFields(['user']), startTimeTracking);
router.post('/:id/time/stop', validateObjectId(), validateRequiredFields(['user']), stopTimeTracking);
router.post('/:id/attachments', validateObjectId(), upload.single('file'), addAttachment);
router.delete('/:id/attachments/:attachmentId', validateObjectId(), removeAttachment);
router.post('/:id/tags', validateObjectId(), validateRequiredFields(['name']), addTag);
router.delete('/:id/tags', validateObjectId(), validateRequiredFields(['name']), removeTag);

// Subtasks & Checklist
router.post('/:id/subtasks', validateObjectId(), validateRequiredFields(['title', 'description', 'assignedTo', 'assignedBy']), addSubtask);
router.delete('/:id/subtasks/:subtaskId', validateObjectId(), deleteSubtask);
router.post('/:id/checklist', validateObjectId(), validateRequiredFields(['text']), addChecklistItem);
router.patch('/:id/checklist', validateObjectId(), validateRequiredFields(['itemId', 'completed']), updateChecklistItem);
router.delete('/:id/checklist/:itemId', validateObjectId(), deleteChecklistItem);
router.get('/:id/subtasks/progress', validateObjectId(), getSubtaskProgress);

// Dependencies
router.post('/:id/dependencies', validateObjectId(), validateRequiredFields(['dependsOn']), addDependency);
router.delete('/:id/dependencies/:dependencyId', validateObjectId(), removeDependency);
router.get('/dependencies/graph', getDependencyGraph);
router.get('/dependencies/critical-path', getCriticalPath);
router.get('/:id/dependencies/blocked', validateObjectId(), checkBlockedTasks);

// Recurring
router.post('/:id/recurring', validateObjectId(), validateRequiredFields(['pattern', 'enabled']), setRecurring);

// Search
router.get('/search', advancedSearch);
router.post('/search/saved', validateRequiredFields(['name', 'filters']), saveSearch);
router.get('/search/saved', getSavedSearches);
router.delete('/search/saved/:id', validateObjectId(), deleteSavedSearch);
router.get('/search/suggestions', getSearchSuggestions);

// Calendar & Timeline
router.get('/calendar/view', getCalendarView);
router.get('/calendar/timeline', getTimelineView);
router.get('/calendar/export', exportICalendar);
router.post('/calendar/sync/google', validateRequiredFields(['accessToken', 'calendarId']), syncGoogleCalendar);

export default router;