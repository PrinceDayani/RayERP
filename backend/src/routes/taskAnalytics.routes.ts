//path: backend/src/routes/taskAnalytics.routes.ts

import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import {
  getTaskAnalytics,
  getBurndownChart,
  getVelocityMetrics,
  getTeamPerformance
} from '../controllers/taskAnalyticsController';
import {
  advancedSearch,
  saveSearch,
  getSavedSearches,
  deleteSavedSearch,
  getSearchSuggestions
} from '../controllers/taskSearchController';
import {
  addDependency,
  removeDependency,
  getDependencyGraph,
  getCriticalPath,
  checkBlockedTasks
} from '../controllers/taskDependencyController';
import {
  getCalendarView,
  exportICalendar,
  getTimelineView,
  syncGoogleCalendar
} from '../controllers/taskCalendarController';

const router = Router();

router.use(authenticateToken);

// Analytics
router.get('/analytics', getTaskAnalytics);
router.get('/analytics/burndown', getBurndownChart);
router.get('/analytics/velocity', getVelocityMetrics);
router.get('/analytics/team-performance', getTeamPerformance);

// Search
router.get('/search', advancedSearch);
router.get('/search/suggestions', getSearchSuggestions);
router.post('/search/saved', saveSearch);
router.get('/search/saved', getSavedSearches);
router.delete('/search/saved/:id', deleteSavedSearch);

// Subtasks & Checklist
const { addSubtask, updateChecklistItem, addChecklistItem, getSubtaskProgress } = require('../controllers/taskSubtaskController');
router.post('/:id/subtasks', addSubtask);
router.post('/:id/checklist', addChecklistItem);
router.patch('/:id/checklist', updateChecklistItem);
router.get('/:id/subtasks/progress', getSubtaskProgress);

// Recurring Tasks
const { setRecurring } = require('../controllers/taskRecurringController');
router.post('/:id/recurring', setRecurring);

// Dependencies
router.post('/:id/dependencies', addDependency);
router.delete('/:id/dependencies/:dependencyId', removeDependency);
router.get('/dependencies/graph', getDependencyGraph);
router.get('/dependencies/critical-path', getCriticalPath);
router.get('/:id/dependencies/blocked', checkBlockedTasks);

// Calendar
router.get('/calendar/view', getCalendarView);
router.get('/calendar/export', exportICalendar);
router.get('/calendar/timeline', getTimelineView);
router.post('/calendar/sync/google', syncGoogleCalendar);

export default router;
