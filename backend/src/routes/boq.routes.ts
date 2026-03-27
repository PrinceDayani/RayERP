import express from 'express';
import { protect } from '../middleware/auth.middleware';
import {
  getAllBOQs,
  createBOQ,
  getBOQsByProject,
  getBOQById,
  updateBOQItem,
  addBOQItem,
  deleteBOQItem,
  approveBOQ,
  activateBOQ,
  getVarianceAnalysis,
  getCostForecast,
  getMilestoneProgress,
  getCategoryBreakdownReport,
  getAuditTrail
} from '../controllers/boqController';

const router = express.Router();

router.get('/all', protect, getAllBOQs);
router.post('/', protect, createBOQ);
router.get('/project/:projectId', protect, getBOQsByProject);
router.get('/:id', protect, getBOQById);
router.put('/:id/items/:itemId', protect, updateBOQItem);
router.post('/:id/items', protect, addBOQItem);
router.delete('/:id/items/:itemId', protect, deleteBOQItem);
router.post('/:id/approve', protect, approveBOQ);
router.post('/:id/activate', protect, activateBOQ);
router.get('/:id/variance', protect, getVarianceAnalysis);
router.get('/:id/forecast', protect, getCostForecast);
router.get('/:id/milestone/:milestoneId/progress', protect, getMilestoneProgress);
router.get('/:id/category-breakdown', protect, getCategoryBreakdownReport);
router.get('/:id/audit-trail', protect, getAuditTrail);

export default router;
