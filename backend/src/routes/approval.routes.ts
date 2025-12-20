import express from 'express';
import {
  createApprovalRequest,
  getPendingApprovals,
  getAllApprovals,
  getApprovalById,
  approveRequest,
  rejectRequest,
  getApprovalStats,
  getApprovalHistory,
  sendReminder,
  searchById
} from '../controllers/approvalController';

const router = express.Router();
const { authenticateToken } = require('../middleware/auth.middleware');

// Apply authentication to all routes
router.use(authenticateToken);

// Approval routes
router.post('/', createApprovalRequest);
router.get('/pending', getPendingApprovals);
router.get('/stats', getApprovalStats);
router.get('/history', getApprovalHistory);
router.get('/search', searchById);
router.get('/:id', getApprovalById);
router.get('/', getAllApprovals);
router.post('/:id/approve', approveRequest);
router.post('/:id/reject', rejectRequest);
router.post('/:id/remind', sendReminder);

export default router;
