//path: backend/src/routes/project.routes.ts

import { Router } from 'express';
import {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getProjectTasks,
  createProjectTask,
  updateProjectTask,
  deleteProjectTask,
  getProjectStats,
  getProjectTimeline,
  getProjectTimelineData,
  getAllProjectsTimelineData,
  updateProjectStatus,
  addProjectMember,
  removeProjectMember,
  getProjectMembers,
  getProjectActivity,
  cloneProject as cloneProjectController,
  updateProjectMilestones,
  updateProjectRisks,
  calculateProjectProgress,
  getProjectTemplates,
  addProjectInstruction,
  updateProjectInstruction,
  deleteProjectInstruction,
  reorderTasks,
  getProjectsByView,
  createProjectFast,
  getEmployeesMinimal,
  getDepartmentsMinimal
} from '../controllers/projectController';
import {
  getProjectFiles,
  uploadProjectFile,
  downloadProjectFile,
  deleteProjectFile,
  shareProjectFile,
  getSharedFiles,
  upload
} from '../controllers/projectFileController';
import {
  getBurndownChart,
  getVelocity,
  getResourceUtilization,
  getPerformanceIndices,
  getRiskAssessment
} from '../controllers/projectAnalyticsController';
import {
  getProjectPermissions,
  setProjectPermissions,
  removeProjectPermissions,
  getEmployeeProjectPermissions
} from '../controllers/projectPermissionController';
import { cloneProject, exportProjectAsTemplate } from '../controllers/projectTemplateController';
import budgetRoutes from './budgetRoutes';
import { authenticateToken } from '../middleware/auth.middleware';
import { requirePermission, requireAnyPermission } from '../middleware/rbac.middleware';
import { checkProjectAccess, checkProjectManagementAccess } from '../middleware/projectAccess.middleware';
import {
  validateObjectId,
  validateRequiredFields,
  validateProjectStatus,
  validatePriority,
  validateDateRange
} from '../middleware/validation.middleware';

const router = Router();

// Apply authentication middleware to all project routes
router.use(authenticateToken);

// --- Fast/Optimized Routes ---
router.get('/employees/minimal', requirePermission('projects.view'), getEmployeesMinimal);
router.get('/departments/minimal', requirePermission('projects.view'), getDepartmentsMinimal);

// --- Core Project Routes ---
router.get('/stats', requirePermission('projects.view'), getProjectStats);
router.get('/timeline-data', requirePermission('projects.view'), getAllProjectsTimelineData);
router.get('/by-view', requirePermission('projects.view'), getProjectsByView);
router.get('/', requirePermission('projects.view'), getAllProjects);
router.get('/:id', validateObjectId(), requirePermission('projects.view'), checkProjectAccess, getProjectById);
router.post('/',
  requirePermission('projects.create'),
  validateRequiredFields(['name', 'description', 'startDate', 'endDate']),
  validateProjectStatus,
  validatePriority,
  validateDateRange,
  createProject
);
import { requireProjectPermission } from '../middleware/projectPermission.middleware';

router.put('/:id',
  validateObjectId(),
  requireProjectPermission('projects.edit', false),
  validateProjectStatus,
  validatePriority,
  validateDateRange,
  updateProject
);
router.delete('/:id', validateObjectId(), requirePermission('projects.delete'), deleteProject);
router.patch('/:id/status',
  validateObjectId(),
  checkProjectAccess,
  validateRequiredFields(['status']),
  validateProjectStatus,
  updateProjectStatus
);

// --- Project Task Routes ---
router.get('/:id/tasks', validateObjectId(), checkProjectAccess, getProjectTasks);
router.post('/:id/tasks',
  validateObjectId(),
  checkProjectAccess,
  validateRequiredFields(['title', 'assignedTo', 'assignedBy']),
  createProjectTask
);
router.put('/:id/tasks/:taskId',
  validateObjectId('id'),
  validateObjectId('taskId'),
  checkProjectAccess,
  updateProjectTask
);
router.delete('/:id/tasks/:taskId',
  validateObjectId('id'),
  validateObjectId('taskId'),
  checkProjectAccess,
  deleteProjectTask
);
router.post('/:id/tasks/reorder',
  validateObjectId(),
  checkProjectAccess,
  validateRequiredFields(['tasks']),
  reorderTasks
);

// --- Member Management Routes ---
router.get('/:id/members', validateObjectId(), checkProjectAccess, getProjectMembers);
router.post('/:id/members',
  validateObjectId(),
  requireProjectPermission('projects.manage_team', true),
  validateRequiredFields(['memberId']),
  addProjectMember
);
router.delete('/:id/members/:memberId',
  validateObjectId('id'),
  validateObjectId('memberId'),
  requireProjectPermission('projects.manage_team', true),
  removeProjectMember
);

// --- Other Project-specific Routes ---
router.get('/:id/timeline', validateObjectId(), checkProjectAccess, getProjectTimeline);
router.get('/:id/timeline-data', validateObjectId(), checkProjectAccess, getProjectTimelineData);
router.get('/:id/activity', validateObjectId(), checkProjectAccess, getProjectActivity);

// --- Template & Cloning Routes ---
router.get('/templates/list', getProjectTemplates);
router.post('/:id/clone', validateObjectId(), requirePermission('projects.create'), cloneProjectController);
router.get('/:id/export-template', validateObjectId(), checkProjectAccess, exportProjectAsTemplate);

// --- Instructions Management Routes ---
router.post('/:id/instructions',
  validateObjectId(),
  checkProjectAccess,
  validateRequiredFields(['title', 'content']),
  addProjectInstruction
);
router.put('/:id/instructions/:instructionId',
  validateObjectId('id'),
  validateObjectId('instructionId'),
  checkProjectAccess,
  updateProjectInstruction
);
router.delete('/:id/instructions/:instructionId',
  validateObjectId('id'),
  validateObjectId('instructionId'),
  checkProjectAccess,
  deleteProjectInstruction
);

// --- Milestone & Risk Management Routes ---
router.put('/:id/milestones', validateObjectId(), checkProjectAccess, updateProjectMilestones);
router.put('/:id/risks', validateObjectId(), checkProjectAccess, updateProjectRisks);
router.post('/:id/calculate-progress', validateObjectId(), checkProjectAccess, calculateProjectProgress);

// --- Analytics Routes ---
router.get('/:id/analytics/burndown', validateObjectId(), checkProjectAccess, getBurndownChart);
router.get('/:id/analytics/velocity', validateObjectId(), checkProjectAccess, getVelocity);
router.get('/:id/analytics/resource-utilization', validateObjectId(), checkProjectAccess, getResourceUtilization);
router.get('/:id/analytics/performance-indices', validateObjectId(), checkProjectAccess, getPerformanceIndices);
router.get('/:id/analytics/risk-assessment', validateObjectId(), checkProjectAccess, getRiskAssessment);

// --- Nested Budget Routes ---
router.use('/:id/budget', budgetRoutes);

// --- File Management Routes ---
router.get('/:id/files', validateObjectId(), checkProjectAccess, getProjectFiles);
router.post('/:id/files', validateObjectId(), checkProjectAccess, upload.single('file'), uploadProjectFile);
router.put('/:id/files/:fileId/share',
  validateObjectId('id'),
  validateObjectId('fileId'),
  checkProjectAccess,
  shareProjectFile
);
router.get('/:id/files/:fileId/download',
  validateObjectId('id'),
  validateObjectId('fileId'),
  checkProjectAccess,
  downloadProjectFile
);
router.delete('/:id/files/:fileId',
  validateObjectId('id'),
  validateObjectId('fileId'),
  checkProjectAccess,
  deleteProjectFile
);

// --- Project Permission Routes ---
router.get('/:id/permissions', validateObjectId(), checkProjectAccess, getProjectPermissions);
router.post('/:id/permissions',
  validateObjectId(),
  requireProjectPermission('projects.manage_team', true),
  validateRequiredFields(['employeeId', 'permissions']),
  setProjectPermissions
);
router.get('/:id/permissions/:employeeId',
  validateObjectId('id'),
  validateObjectId('employeeId'),
  checkProjectAccess,
  getEmployeeProjectPermissions
);
router.delete('/:id/permissions/:employeeId',
  validateObjectId('id'),
  validateObjectId('employeeId'),
  requireProjectPermission('projects.manage_team', true),
  removeProjectPermissions
);

// --- Shared Files Route ---
router.get('/shared/files', getSharedFiles);

export default router;