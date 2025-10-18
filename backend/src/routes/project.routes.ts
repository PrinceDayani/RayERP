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
  updateProjectStatus,
  addProjectMember,
  removeProjectMember,
  getProjectMembers
} from '../controllers/projectController';
import {
  getProjectFiles,
  uploadProjectFile,
  downloadProjectFile,
  deleteProjectFile,
  upload
} from '../controllers/projectFileController';
import budgetRoutes from './budgetRoutes';
import { authenticateToken } from '../middleware/auth.middleware';
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

// --- Core Project Routes ---
router.get('/stats', getProjectStats);
router.get('/', getAllProjects);
router.get('/:id', validateObjectId(), checkProjectAccess, getProjectById);
router.post('/',
  checkProjectManagementAccess,
  validateRequiredFields(['name', 'description', 'startDate', 'endDate', 'manager']),
  validateProjectStatus,
  validatePriority,
  validateDateRange,
  createProject
);
router.put('/:id',
  validateObjectId(),
  checkProjectAccess,
  validateProjectStatus,
  validatePriority,
  validateDateRange,
  updateProject
);
router.delete('/:id', validateObjectId(), checkProjectManagementAccess, deleteProject);
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

// --- Member Management Routes ---
router.get('/:id/members', validateObjectId(), checkProjectAccess, getProjectMembers);
router.post('/:id/members',
  validateObjectId(),
  checkProjectManagementAccess,
  validateRequiredFields(['memberId']),
  addProjectMember
);
router.delete('/:id/members/:memberId',
  validateObjectId('id'),
  validateObjectId('memberId'),
  checkProjectManagementAccess,
  removeProjectMember
);

// --- Other Project-specific Routes ---
router.get('/:id/timeline', validateObjectId(), checkProjectAccess, getProjectTimeline);

// --- Nested Budget Routes ---
router.use('/:id/budget', budgetRoutes);

// --- File Management Routes ---
router.get('/:id/files', validateObjectId(), checkProjectAccess, getProjectFiles);
router.post('/:id/files', validateObjectId(), checkProjectAccess, upload.single('file'), uploadProjectFile);
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

export default router;