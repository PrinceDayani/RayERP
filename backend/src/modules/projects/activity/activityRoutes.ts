import { Router } from 'express';
import { getProjectActivity } from './activityController';
import { validateObjectId } from '../../../middleware/validation.middleware';
import { checkProjectAccess } from '../../../middleware/projectAccess.middleware';

const router = Router({ mergeParams: true });

router.get('/', validateObjectId('id'), checkProjectAccess, getProjectActivity);

export default router;
