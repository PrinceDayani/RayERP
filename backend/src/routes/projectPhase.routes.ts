//path: backend/src/routes/projectPhase.routes.ts
//
// Phase-scoped routes. Phases nested under a project (list / create / reorder)
// live in project.routes.ts; everything addressed by phase id lives here.

import { Router } from 'express';
import {
  getPhaseById,
  updatePhase,
  deletePhase,
  updatePhaseMilestones,
  submitPhaseForReview,
  reviewPhase,
  withdrawPhaseReview,
  getPendingPhaseReviews,
  getPhaseWorkflow
} from '../controllers/projectPhaseController';
import { authenticateToken } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/rbac.middleware';
import { checkPhaseAccess } from '../middleware/projectAccess.middleware';
import { validateObjectId } from '../middleware/validation.middleware';

const router = Router();

router.use(authenticateToken);

// The caller's own review queue — must precede /:id so it is not read as an id
router.get('/pending-review', requirePermission('projects.review_phases'), getPendingPhaseReviews);

// --- Phase CRUD ---
router.get('/:id', validateObjectId(), checkPhaseAccess, requirePermission('projects.view'), getPhaseById);
router.put('/:id', validateObjectId(), checkPhaseAccess, requirePermission('projects.manage_phases'), updatePhase);
router.delete('/:id', validateObjectId(), checkPhaseAccess, requirePermission('projects.manage_phases'), deletePhase);
router.put('/:id/milestones', validateObjectId(), checkPhaseAccess, requirePermission('projects.manage_phases'), updatePhaseMilestones);

// --- Departmental review ---
router.post('/:id/submit-review', validateObjectId(), checkPhaseAccess, requirePermission('projects.manage_phases'), submitPhaseForReview);
router.post('/:id/withdraw-review', validateObjectId(), checkPhaseAccess, requirePermission('projects.manage_phases'), withdrawPhaseReview);
router.get('/:id/workflow', validateObjectId(), checkPhaseAccess, requirePermission('projects.view'), getPhaseWorkflow);

// Reviewers act on phases of projects they may not otherwise be members of, so
// this route is gated on the review permission plus the engine's own
// assignee check rather than on project membership.
router.post('/:id/review', validateObjectId(), requirePermission('projects.review_phases'), reviewPhase);

export default router;
