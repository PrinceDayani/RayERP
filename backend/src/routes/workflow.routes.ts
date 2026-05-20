import express from 'express';
import {
  // Template controllers
  createTemplate,
  getTemplates,
  getTemplateById,
  updateTemplate,
  deleteTemplate,
  cloneTemplate,
  // Instance controllers
  startWorkflow,
  getInstances,
  getInstanceById,
  getMyPendingActions,
  getEntityWorkflows,
  processStepAction,
  addComment,
  cancelWorkflow,
  holdWorkflow,
  resumeWorkflow,
  // Analytics controllers
  getDashboardStats,
  getPerformanceReport,
  getBottleneckAnalysis
} from '../controllers/workflowController';
import {
  getProjectWorkflow,
  getProjectWorkflowHistory,
  restartProjectWorkflow,
  startProjectWorkflow
} from '../controllers/workflowProjectController';

const router = express.Router();
const { authenticateToken } = require('../middleware/auth.middleware');

// Apply authentication to all routes
router.use(authenticateToken);

// ==========================================
// WORKFLOW TEMPLATE ROUTES
// ==========================================
router.post('/templates', createTemplate);
router.get('/templates', getTemplates);
router.get('/templates/:id', getTemplateById);
router.put('/templates/:id', updateTemplate);
router.delete('/templates/:id', deleteTemplate);
router.post('/templates/:id/clone', cloneTemplate);

// ==========================================
// WORKFLOW INSTANCE ROUTES
// ==========================================
router.post('/instances', startWorkflow);
router.get('/instances', getInstances);
router.get('/instances/my-pending', getMyPendingActions);
router.get('/instances/:id', getInstanceById);
router.post('/instances/:id/steps/:stepId/action', processStepAction);
router.post('/instances/:id/comments', addComment);
router.post('/instances/:id/cancel', cancelWorkflow);
router.post('/instances/:id/hold', holdWorkflow);
router.post('/instances/:id/resume', resumeWorkflow);

// Entity-specific workflow lookup
router.get('/entity/:entityType/:entityId', getEntityWorkflows);

// ==========================================
// PROJECT-WORKFLOW INTEGRATION ROUTES
// ==========================================
router.get('/project/:projectId', getProjectWorkflow);
router.get('/project/:projectId/history', getProjectWorkflowHistory);
router.post('/project/:projectId/start', startProjectWorkflow);
router.post('/project/:projectId/restart', restartProjectWorkflow);

// ==========================================
// WORKFLOW ANALYTICS ROUTES
// ==========================================
router.get('/analytics/dashboard', getDashboardStats);
router.get('/analytics/performance', getPerformanceReport);
router.get('/analytics/bottlenecks', getBottleneckAnalysis);

export default router;
