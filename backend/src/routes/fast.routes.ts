import express from 'express';
import { getProjectsFast, getProjectByIdFast, updateProjectFast, getProjectTasksFast } from '../controllers/optimizedProjectController';
import { fastAuth } from '../middleware/auth.fast';

const router = express.Router();

// Fast routes with minimal middleware
router.get('/projects', fastAuth, getProjectsFast);
router.get('/projects/:id', fastAuth, getProjectByIdFast);
router.put('/projects/:id', fastAuth, updateProjectFast);
router.get('/projects/:id/tasks', fastAuth, getProjectTasksFast);

module.exports = router;
export default router;