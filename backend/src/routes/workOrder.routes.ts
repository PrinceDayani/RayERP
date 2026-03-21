import express from 'express';
import { protect } from '../middleware/auth.middleware';
import {
  createWorkOrder,
  getWorkOrdersByProject,
  getWorkOrderById,
  updateWorkOrder,
  submitWorkOrderForApproval,
  approveWorkOrder,
  rejectWorkOrder,
  issueWorkOrder,
  updateWorkOrderStatus,
  recordWorkOrderPayment,
  getWorkOrderAnalytics
} from '../controllers/workOrderController';

const router = express.Router();

router.post('/', protect, createWorkOrder);
router.get('/project/:projectId', protect, getWorkOrdersByProject);
router.get('/project/:projectId/analytics', protect, getWorkOrderAnalytics);
router.get('/:id', protect, getWorkOrderById);
router.put('/:id', protect, updateWorkOrder);
router.post('/:id/submit', protect, submitWorkOrderForApproval);
router.post('/:id/approve', protect, approveWorkOrder);
router.post('/:id/reject', protect, rejectWorkOrder);
router.post('/:id/issue', protect, issueWorkOrder);
router.patch('/:id/status', protect, updateWorkOrderStatus);
router.post('/:id/payments', protect, recordWorkOrderPayment);

export default router;
