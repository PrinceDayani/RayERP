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
  updateProjectStatus
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
router.get('/:id', validateObjectId(), getProjectById);
router.post('/',
  validateRequiredFields(['name', 'description', 'startDate', 'endDate', 'manager']),
  validateProjectStatus,
  validatePriority,
  validateDateRange,
  createProject
);
router.put('/:id',
  validateObjectId(),
  validateProjectStatus,
  validatePriority,
  validateDateRange,
  updateProject
);
router.delete('/:id', validateObjectId(), deleteProject);
router.patch('/:id/status',
  validateObjectId(),
  validateRequiredFields(['status']),
  validateProjectStatus,
  updateProjectStatus
);

// --- Project Task Routes ---
router.get('/:id/tasks', validateObjectId(), getProjectTasks);
router.post('/:id/tasks',
  validateObjectId(),
  validateRequiredFields(['title', 'assignedTo', 'assignedBy']),
  createProjectTask
);
router.put('/:id/tasks/:taskId',
  validateObjectId('id'),
  validateObjectId('taskId'),
  updateProjectTask
);
router.delete('/:id/tasks/:taskId',
  validateObjectId('id'),
  validateObjectId('taskId'),
  deleteProjectTask
);

// --- Other Project-specific Routes ---
router.get('/:id/timeline', validateObjectId(), getProjectTimeline);

// --- Nested Budget Routes ---
router.use('/:id/budget', budgetRoutes);

// --- File Management Routes ---
router.get('/:id/files', validateObjectId(), getProjectFiles);
router.post('/:id/files', validateObjectId(), upload.single('file'), uploadProjectFile);
router.get('/:id/files/:fileId/download',
  validateObjectId('id'),
  validateObjectId('fileId'),
  downloadProjectFile
);
router.delete('/:id/files/:fileId',
  validateObjectId('id'),
  validateObjectId('fileId'),
  deleteProjectFile
);

export default router;