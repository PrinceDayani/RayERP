//path: backend/src/routes/projectTemplate.routes.ts

import express from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import * as controller from '../controllers/projectTemplateController';

const router = express.Router();

router.get('/', authenticateToken, controller.getTemplates);
router.post('/', authenticateToken, controller.createTemplate);
router.post('/:templateId/create-project', authenticateToken, controller.createProjectFromTemplate);

export default router;
