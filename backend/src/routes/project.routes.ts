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
import { authenticateToken } from '../middleware/auth.middleware';
import {
  validateObjectId,
  validateRequiredFields,
  validateProjectStatus,
  validatePriority,
  validateDateRange
} from '../middleware/validation.middleware';

const router = Router();

router.use(authenticateToken);

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
router.get('/:id/timeline', validateObjectId(), getProjectTimeline);
router.patch('/:id/status', 
  validateObjectId(),
  validateRequiredFields(['status']),
  validateProjectStatus,
  updateProjectStatus
);

export default router;