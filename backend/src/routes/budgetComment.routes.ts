import express from 'express';
import { authenticateToken as authenticate } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/budgetAuth';
const { body, param } = require('express-validator');
import { validateRequest } from '../middleware/validation.middleware';
import {
  createComment,
  getBudgetComments,
  updateComment,
  deleteComment,
  addReaction,
  removeReaction,
  getBudgetActivity,
  getUserMentions
} from '../controllers/budgetCommentController';

const router = express.Router();

router.use(authenticate);

// Create comment (requires view permission)
router.post('/budget/:budgetId',
  param('budgetId').isMongoId().withMessage('Invalid budget ID'),
  body('content').notEmpty().withMessage('Content is required'),
  body('mentions').optional().isArray(),
  validateRequest,
  requirePermission('budgets.view'),
  createComment
);

// Get budget comments (requires view permission)
router.get('/budget/:budgetId',
  param('budgetId').isMongoId().withMessage('Invalid budget ID'),
  validateRequest,
  requirePermission('budgets.view'),
  getBudgetComments
);

// Update comment
router.put('/:commentId',
  param('commentId').isMongoId().withMessage('Invalid comment ID'),
  body('content').notEmpty().withMessage('Content is required'),
  validateRequest,
  updateComment
);

// Delete comment
router.delete('/:commentId',
  param('commentId').isMongoId().withMessage('Invalid comment ID'),
  validateRequest,
  deleteComment
);

// Add reaction
router.post('/:commentId/reaction',
  param('commentId').isMongoId().withMessage('Invalid comment ID'),
  body('type').isIn(['like', 'approve', 'concern', 'question']),
  validateRequest,
  addReaction
);

// Remove reaction
router.delete('/:commentId/reaction',
  param('commentId').isMongoId().withMessage('Invalid comment ID'),
  validateRequest,
  removeReaction
);

// Get budget activity feed
router.get('/budget/:budgetId/activity',
  param('budgetId').isMongoId().withMessage('Invalid budget ID'),
  validateRequest,
  requirePermission('budgets.view'),
  getBudgetActivity
);

// Get user mentions
router.get('/mentions/me', getUserMentions);

export default router;
