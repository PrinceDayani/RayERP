//path: backend/src/routes/project.routes.ts

import { Router } from 'express';
import {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getProjectStats,
  updateProjectStatus,
  addProjectMember,
  removeProjectMember,
  getProjectMembers,
  cloneProject as cloneProjectController,
  updateProjectMilestones,
  updateProjectRisks,
  calculateProjectProgress,
  getProjectTemplates,
  addProjectInstruction,
  updateProjectInstruction,
  deleteProjectInstruction,
  getProjectsByView,
  createProjectFast,
  getEmployeesMinimal,
  getDepartmentsMinimal
} from '../controllers/projectController';
import { cloneProject, exportProjectAsTemplate } from '../controllers/projectTemplateController';
import { getSharedFiles } from '../controllers/projectFileController';

// Modular routes
import taskRoutes from '../modules/projects/tasks/taskRoutes';
import budgetRoutes from '../modules/projects/budget/budgetRoutes';
import timelineRoutes from '../modules/projects/timeline/timelineRoutes';
import fileRoutes from '../modules/projects/files/fileRoutes';
import financeRoutes from '../modules/projects/finance/financeRoutes';
import permissionRoutes from '../modules/projects/permissions/permissionRoutes';
import activityRoutes from '../modules/projects/activity/activityRoutes';
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

// --- Modular Routes ---
router.use('/:id/tasks', taskRoutes);
router.use('/:id/budget', budgetRoutes);
router.use('/:id/timeline', timelineRoutes);
router.use('/:id/files', fileRoutes);
router.use('/:id/finance', financeRoutes);
router.use('/:id/permissions', permissionRoutes);
router.use('/:id/activity', activityRoutes);

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



// --- Shared Files Route ---
router.get('/shared/files', getSharedFiles);

export default router;