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
  getBidComparison,
  updateEligibility,
  recordTenderFee,
  recordEMD,
  addCorrigendum,
  saveOurBid,
  recordOpeningResults,
  recordLetterOfAward,
  recordAgreement,
  recordPerformanceGuarantee,
  convertTenderToProject,
  getBidReadiness
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

// --- Lifecycle / Status Transitions (both directions) ---
router.post('/:id/transition', requirePermission('tenders.manage'), transitionTenderStatus);

// ==========================================
// direction: 'issued' — we publish, vendors bid
// ==========================================

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

// ==========================================
// direction: 'bidding' — an authority publishes, we bid
// ==========================================

// --- Bid preparation ---
router.get('/:id/readiness', requirePermission('tenders.view'), getBidReadiness);
router.put('/:id/eligibility', requirePermission('tenders.bid'), updateEligibility);
router.post('/:id/corrigenda', requirePermission('tenders.bid'), addCorrigendum);
router.put('/:id/our-bid', requirePermission('tenders.bid'), saveOurBid);

// --- Money in and out of the authority's hands ---
router.put('/:id/tender-fee', requirePermission('tenders.finance'), recordTenderFee);
router.put('/:id/emd', requirePermission('tenders.finance'), recordEMD);
router.put('/:id/performance-guarantee', requirePermission('tenders.finance'), recordPerformanceGuarantee);

// --- Opening & outcome ---
router.put('/:id/opening', requirePermission('tenders.bid'), recordOpeningResults);
router.put('/:id/loa', requirePermission('tenders.award'), recordLetterOfAward);
router.put('/:id/agreement', requirePermission('tenders.award'), recordAgreement);

// --- Conversion ---
router.post('/:id/convert-to-project', requirePermission('tenders.award'), convertTenderToProject);

export default router;
