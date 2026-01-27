import { Router } from 'express';
import {
  getProjectTimeline,
  getProjectTimelineData,
  getAllProjectsTimelineData
} from './timelineController';
import { validateObjectId } from '../../../middleware/validation.middleware';
import { checkProjectAccess } from '../../../middleware/projectAccess.middleware';
import { requirePermission } from '../../../middleware/rbac.middleware';

const router = Router({ mergeParams: true });

router.get('/all', requirePermission('projects.view'), getAllProjectsTimelineData);
router.get('/', validateObjectId('id'), checkProjectAccess, getProjectTimeline);
router.get('/data', validateObjectId('id'), checkProjectAccess, getProjectTimelineData);

export default router;
