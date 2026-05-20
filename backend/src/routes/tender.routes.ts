import express from 'express';
import { protect } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/rbac.middleware';
import {
  createTender,
  getAllTenders,
  getTenderById,
  updateTender,
  deleteTender,
  transitionTenderStatus,
  addBidder,
  submitBid,
  evaluateBid,
  updateBidStatus,
  awardTender,
  generateWorkOrder,
  getTenderStats,
  getTenderTimeline,
  getBidComparison
} from '../controllers/tenderController';

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);

// --- Dashboard & Stats ---
router.get('/stats', requirePermission('tenders.view'), getTenderStats);

// --- CRUD ---
router.get('/', requirePermission('tenders.view'), getAllTenders);
router.get('/:id', requirePermission('tenders.view'), getTenderById);
router.post('/', requirePermission('tenders.create'), createTender);
router.put('/:id', requirePermission('tenders.edit'), updateTender);
router.delete('/:id', requirePermission('tenders.delete'), deleteTender);

// --- Lifecycle / Status Transitions ---
router.post('/:id/transition', requirePermission('tenders.manage'), transitionTenderStatus);

// --- Bid Management ---
router.post('/:id/bids', requirePermission('tenders.manage_bids'), addBidder);
router.put('/:id/bids/:bidIndex/submit', requirePermission('tenders.manage_bids'), submitBid);
router.put('/:id/bids/:bidIndex/evaluate', requirePermission('tenders.evaluate'), evaluateBid);
router.put('/:id/bids/:bidIndex/status', requirePermission('tenders.evaluate'), updateBidStatus);

// --- Award & Work Order ---
router.post('/:id/award', requirePermission('tenders.award'), awardTender);
router.post('/:id/generate-work-order', requirePermission('tenders.award'), generateWorkOrder);

// --- Analytics & Views ---
router.get('/:id/timeline', requirePermission('tenders.view'), getTenderTimeline);
router.get('/:id/bid-comparison', requirePermission('tenders.evaluate'), getBidComparison);

export default router;
