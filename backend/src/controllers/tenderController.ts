import { Request, Response } from 'express';
import Tender, { ITender, TenderStatus, TenderDirection, ITenderOutcome } from '../models/Tender';
import Project from '../models/Project';
import WorkOrder from '../models/WorkOrder';
import BOQ from '../models/BOQ';
import mongoose from 'mongoose';

// --- Helper: Generate Tender Number ---
const generateTenderNumber = async (): Promise<string> => {
  const year = new Date().getFullYear();
  const count = await Tender.countDocuments();
  return `TND-${year}-${String(count + 1).padStart(5, '0')}`;
};

// --- Valid Status Transitions, per direction ---
// The two lifecycles are disjoint apart from in-progress/completed/cancelled,
// so a tender can never cross from one side's flow into the other's.
const ISSUED_TRANSITIONS: Partial<Record<TenderStatus, TenderStatus[]>> = {
  'draft': ['published', 'cancelled'],
  'published': ['bid-submission', 'cancelled'],
  'bid-submission': ['evaluation', 'no-bid', 'cancelled'],
  'evaluation': ['negotiation', 'awarded', 'cancelled'],
  'negotiation': ['awarded', 'cancelled'],
  'awarded': ['work-order-issued', 'cancelled'],
  'work-order-issued': ['in-progress', 'cancelled'],
  'in-progress': ['completed', 'cancelled'],
  'completed': [],
  'cancelled': [],
  'no-bid': ['published']  // Can re-publish
};

const BIDDING_TRANSITIONS: Partial<Record<TenderStatus, TenderStatus[]>> = {
  'identified': ['go-no-go', 'dropped', 'cancelled'],
  'go-no-go': ['preparing', 'dropped', 'cancelled'],
  'preparing': ['submitted', 'dropped', 'cancelled'],
  'submitted': ['technical-opening', 'lost', 'cancelled'],
  'technical-opening': ['financial-opening', 'lost', 'cancelled'],
  'financial-opening': ['won', 'lost', 'cancelled'],
  'won': ['in-progress', 'cancelled'],
  'in-progress': ['completed', 'cancelled'],
  'lost': [],
  'dropped': [],
  'completed': [],
  'cancelled': []
};

const transitionsFor = (direction: TenderDirection) =>
  direction === 'bidding' ? BIDDING_TRANSITIONS : ISSUED_TRANSITIONS;

// Stages at which the tender's own particulars may still be edited. A bidding
// tender never passes through 'draft', so the two directions differ.
const EDITABLE_STATUSES: Record<TenderDirection, TenderStatus[]> = {
  issued: ['draft', 'published'],
  bidding: ['identified', 'go-no-go', 'preparing']
};

// Deleting is only for a tender recorded by mistake; anything further along
// must be cancelled so the audit trail survives.
const DELETABLE_STATUSES: Record<TenderDirection, TenderStatus[]> = {
  issued: ['draft'],
  bidding: ['identified']
};

const isInvalidId = (id: any) => !id || !mongoose.isValidObjectId(String(id));

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const MAX_PAGE_LIMIT = 50;

const TENDER_SORT_FIELDS = new Set([
  'createdAt', 'updatedAt', 'submissionDeadline', 'publishDate', 'awardDate',
  'estimatedValue', 'title', 'tenderNumber', 'status', 'priority'
]);

/**
 * Reject an operation that belongs to the other side of the tender.
 */
const requireDirection = (
  tender: ITender,
  direction: TenderDirection,
  res: Response
): boolean => {
  if (tender.direction !== direction) {
    res.status(400).json({
      success: false,
      message: `This operation applies only to tenders with direction '${direction}'; this tender is '${tender.direction}'.`
    });
    return false;
  }
  return true;
};

const recordAudit = (
  tender: ITender,
  action: string,
  userId: mongoose.Types.ObjectId,
  notes?: string,
  details?: Record<string, any>
) => {
  tender.auditTrail.push({
    action,
    performedBy: userId,
    timestamp: new Date(),
    details,
    notes
  });
};

// ==========================================
// CRUD OPERATIONS
// ==========================================

/**
 * Create a new tender
 */
export const createTender = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { title, type, category } = req.body;
    const direction: TenderDirection = req.body.direction === 'bidding' ? 'bidding' : 'issued';

    // Minimal validation
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }
    if (!type) {
      return res.status(400).json({ success: false, message: 'Tender type is required (open, limited, single-source, two-envelope, reverse-auction)' });
    }
    if (!category) {
      return res.status(400).json({ success: false, message: 'Category is required (works, goods, services, consultancy)' });
    }
    // A tender we chase is meaningless without knowing who published it
    if (direction === 'bidding' && !req.body.issuingAuthority?.name?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Issuing authority name is required for tenders we are bidding on'
      });
    }

    const tenderNumber = await generateTenderNumber();
    const initialStatus: TenderStatus = direction === 'bidding' ? 'identified' : 'draft';

    const tender = new Tender({
      ...req.body,
      direction,
      tenderNumber,
      status: initialStatus,
      createdBy: req.user._id,
      auditTrail: [{
        action: 'created',
        performedBy: req.user._id,
        timestamp: new Date(),
        newStatus: initialStatus,
        notes: direction === 'bidding' ? 'Tender opportunity recorded' : 'Tender created'
      }]
    });

    await tender.save();

    res.status(201).json({ success: true, data: tender });
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e: any) => e.message);
      return res.status(400).json({ success: false, message: messages.join(', '), errors: error.errors });
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * Get all tenders with filters and pagination
 */
export const getAllTenders = async (req: Request, res: Response) => {
  try {
    const {
      status, type, category, department, priority, direction, portal, outcome,
      page = '1', limit = '20', search, sortBy = 'createdAt', sortOrder = 'desc'
    } = req.query;

    const filter: any = {};
    if (status) filter.status = status;
    if (type) filter.type = type;
    if (category) filter.category = category;
    if (department) filter.department = department;
    if (priority) filter.priority = priority;
    if (direction === 'issued' || direction === 'bidding') filter.direction = direction;
    if (portal) filter.portal = portal;
    if (outcome) filter['outcome.result'] = outcome;
    if (search) {
      const term = escapeRegex(String(search));
      filter.$or = [
        { title: { $regex: term, $options: 'i' } },
        { tenderNumber: { $regex: term, $options: 'i' } },
        { referenceNumber: { $regex: term, $options: 'i' } },
        { tenderNoticeNumber: { $regex: term, $options: 'i' } },
        { portalTenderId: { $regex: term, $options: 'i' } },
        { 'issuingAuthority.name': { $regex: term, $options: 'i' } }
      ];
    }

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(MAX_PAGE_LIMIT, Math.max(1, parseInt(limit as string, 10) || 20));
    const skip = (pageNum - 1) * limitNum;
    const sortField = TENDER_SORT_FIELDS.has(String(sortBy)) ? String(sortBy) : 'createdAt';
    const sort: any = { [sortField]: sortOrder === 'asc' ? 1 : -1 };

    const [tenders, total] = await Promise.all([
      Tender.find(filter)
        // Bid pricing, EMD instrument refs and the audit trail are detail-view
        // concerns; keep them off the list so a broad tenders.view does not
        // expose commercially sensitive figures in bulk
        .select('-ourBid.financial -emd.instrumentRef -competitors -bids -auditTrail -eligibility')
        .populate('department', 'name')
        .populate('createdBy', 'name email')
        .populate('awardedBidder', 'name email company')
        .populate('project', 'name status')
        .sort(sort)
        .skip(skip)
        .limit(limitNum),
      Tender.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: tenders,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get a single tender by ID
 */
export const getTenderById = async (req: Request, res: Response) => {
  try {
    const tender = await Tender.findById(req.params.id)
      .populate('department', 'name')
      .populate('createdBy', 'name email')
      .populate('tenderCommittee', 'name email')
      .populate('approvedBy', 'name email')
      .populate('awardedBidder', 'name email company phone')
      .populate('project', 'name status budget progress')
      .populate('workOrder', 'woNumber status totalAmount')
      .populate('boq', 'version status totalPlannedAmount')
      .populate('bids.bidder', 'name email company phone');

    if (!tender) {
      return res.status(404).json({ success: false, message: 'Tender not found' });
    }

    res.json({ success: true, data: tender });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Update tender details (only in draft/published status)
 */
export const updateTender = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const tender = await Tender.findById(req.params.id);
    if (!tender) {
      return res.status(404).json({ success: false, message: 'Tender not found' });
    }

    // Each direction has its own set of still-editable stages
    if (!EDITABLE_STATUSES[tender.direction].includes(tender.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot edit tender in '${tender.status}' status. Editable stages: ${EDITABLE_STATUSES[tender.direction].join(', ')}.`
      });
    }

    // Status, identity and direction move only through their own endpoints
    const { status, tenderNumber, auditTrail, bids, direction, ...updateData } = req.body;

    Object.assign(tender, updateData);

    tender.auditTrail.push({
      action: 'updated',
      performedBy: req.user._id,
      timestamp: new Date(),
      details: { fieldsUpdated: Object.keys(updateData) },
      notes: req.body.updateNotes || 'Tender details updated'
    });

    await tender.save();

    res.json({ success: true, data: tender });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * Delete a tender (only in draft status)
 */
export const deleteTender = async (req: Request, res: Response) => {
  try {
    const tender = await Tender.findById(req.params.id);
    if (!tender) {
      return res.status(404).json({ success: false, message: 'Tender not found' });
    }

    if (!DELETABLE_STATUSES[tender.direction].includes(tender.status)) {
      return res.status(400).json({
        success: false,
        message: `Only a tender that has not left its opening stage can be deleted (${DELETABLE_STATUSES[tender.direction].join(', ')}). Cancel the tender instead.`
      });
    }

    await Tender.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Tender deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// LIFECYCLE / STATUS TRANSITIONS
// ==========================================

/**
 * Transition tender to next status (lifecycle management)
 */
export const transitionTenderStatus = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { newStatus, notes } = req.body;
    const tender = await Tender.findById(req.params.id);

    if (!tender) {
      return res.status(404).json({ success: false, message: 'Tender not found' });
    }

    const currentStatus = tender.status;

    // Validate transition against this tender's own lifecycle
    const allowedTransitions = transitionsFor(tender.direction)[currentStatus];
    if (!allowedTransitions || !allowedTransitions.includes(newStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid transition from '${currentStatus}' to '${newStatus}'. Allowed: ${allowedTransitions?.join(', ') || 'none'}`
      });
    }

    // Status-specific validations
    const validationError = validateTransition(tender, newStatus);
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    // Apply status-specific side effects
    await applyTransitionEffects(tender, newStatus, req.user._id);

    const previousStatus = tender.status;
    tender.status = newStatus;

    // Update timeline
    const timelineEvent = tender.timeline.find(t => t.event === newStatus);
    if (timelineEvent) {
      timelineEvent.actualDate = new Date();
      timelineEvent.status = 'completed';
    }

    // Audit trail
    tender.auditTrail.push({
      action: `status_changed`,
      performedBy: req.user._id,
      timestamp: new Date(),
      previousStatus,
      newStatus,
      notes: notes || `Status changed from ${previousStatus} to ${newStatus}`
    });

    await tender.save();

    res.json({
      success: true,
      data: tender,
      message: `Tender status changed from '${previousStatus}' to '${newStatus}'`
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Validate if a transition is allowed based on business rules
 */
function validateTransition(tender: ITender, newStatus: TenderStatus): string | null {
  if (tender.direction === 'bidding') {
    return validateBiddingTransition(tender, newStatus);
  }

  switch (newStatus) {
    case 'published':
      if (!tender.submissionDeadline) return 'Submission deadline is required before publishing';
      if (!tender.scopeOfWork) return 'Scope of work is required before publishing';
      if (!tender.evaluationCriteria || tender.evaluationCriteria.length === 0) {
        return 'At least one evaluation criterion is required before publishing';
      }
      break;

    case 'bid-submission':
      if (!tender.publishDate) return 'Tender must have a publish date';
      break;

    case 'evaluation':
      if (!tender.bids || tender.bids.length === 0) return 'No bids received to evaluate';
      const submittedBids = tender.bids.filter(b => b.status === 'submitted');
      if (submittedBids.length === 0) return 'No submitted bids to evaluate';
      break;

    case 'awarded':
      const selectedBid = tender.bids.find(b => b.status === 'selected');
      if (!selectedBid) return 'A bid must be selected before awarding the tender';
      break;

    case 'work-order-issued':
      if (!tender.awardedBidder) return 'Tender must be awarded before issuing work order';
      break;
  }
  return null;
}

/**
 * Business rules for the bidding lifecycle. Blocking here rather than at
 * submission time is deliberate: an unmet mandatory criterion or an unpaid EMD
 * is grounds for the authority to reject the bid outright.
 */
function validateBiddingTransition(tender: ITender, newStatus: TenderStatus): string | null {
  switch (newStatus) {
    case 'preparing':
      if (!tender.submissionDeadline) return 'Submission deadline is required before preparing a bid';
      break;

    case 'submitted': {
      if (!tender.ourBid?.financial?.finalAmount) {
        return 'A financial bid amount is required before marking the bid submitted';
      }
      const feeOutstanding = tender.tenderFee
        && !tender.tenderFee.exempted
        && tender.tenderFee.amount > 0
        && !tender.tenderFee.paid;
      if (feeOutstanding) return 'Tender fee is unpaid';

      const emdOutstanding = tender.emd
        && tender.emd.mode !== 'exempted'
        && tender.emd.amount > 0
        && tender.emd.status === 'pending';
      if (emdOutstanding) return 'EMD has not been submitted';

      const unmet = tender.eligibility.filter(
        e => e.mandatory && (e.ourStatus === 'not-met' || e.ourStatus === 'unverified')
      );
      if (unmet.length) {
        return `${unmet.length} mandatory eligibility criterion/criteria are unmet or unverified: ${unmet.slice(0, 3).map(e => e.criterion).join('; ')}`;
      }
      break;
    }

    case 'in-progress':
      if (!tender.loa?.received) return 'Letter of Award must be recorded before work can start';
      break;
  }
  return null;
}

/**
 * Apply side effects when transitioning status
 */
async function applyTransitionEffects(tender: ITender, newStatus: TenderStatus, userId: mongoose.Types.ObjectId) {
  if (tender.direction === 'bidding') {
    return applyBiddingTransitionEffects(tender, newStatus);
  }

  switch (newStatus) {
    case 'published':
      tender.publishDate = new Date();
      break;

    case 'awarded':
      const selectedBid = tender.bids.find(b => b.status === 'selected');
      if (selectedBid) {
        tender.awardedBidder = selectedBid.bidder;
        tender.awardedAmount = selectedBid.bidAmount;
        tender.awardDate = new Date();
      }
      break;

    case 'work-order-issued':
      tender.workOrderDate = new Date();
      break;
  }
}

/**
 * Date and outcome bookkeeping for the bidding lifecycle.
 */
function applyBiddingTransitionEffects(tender: ITender, newStatus: TenderStatus) {
  const now = new Date();

  // Patch the outcome subdocument without dropping fields already recorded
  const setOutcome = (patch: Partial<ITenderOutcome>) => {
    tender.set('outcome', {
      result: tender.outcome?.result || 'awaited',
      ourRank: tender.outcome?.ourRank,
      l1Amount: tender.outcome?.l1Amount,
      l1Bidder: tender.outcome?.l1Bidder,
      declaredOn: tender.outcome?.declaredOn,
      reason: tender.outcome?.reason,
      ...patch
    });
  };

  switch (newStatus) {
    case 'submitted':
      if (tender.ourBid && !tender.ourBid.submittedAt) tender.ourBid.submittedAt = now;
      setOutcome({ result: 'awaited' });
      break;

    case 'technical-opening':
      tender.technicalOpeningDate = tender.technicalOpeningDate || now;
      break;

    case 'financial-opening':
      tender.financialOpeningDate = tender.financialOpeningDate || now;
      setOutcome({ result: 'technically-qualified' });
      if (tender.ourBid?.technical) tender.ourBid.technical.qualified = true;
      break;

    case 'won':
      setOutcome({ result: 'won', declaredOn: tender.outcome?.declaredOn || now });
      tender.awardDate = tender.awardDate || now;
      break;

    case 'lost':
      setOutcome({ result: 'lost', declaredOn: tender.outcome?.declaredOn || now });
      break;
  }
}

// ==========================================
// BID MANAGEMENT
// ==========================================

/**
 * Add/invite a bidder to the tender
 */
export const addBidder = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const tender = await Tender.findById(req.params.id);
    if (!tender) {
      return res.status(404).json({ success: false, message: 'Tender not found' });
    }

    if (!requireDirection(tender, 'issued', res)) return;

    if (!['draft', 'published', 'bid-submission'].includes(tender.status)) {
      return res.status(400).json({
        success: false,
        message: 'Bidders can only be added in draft, published, or bid-submission stage'
      });
    }

    const { bidderId, bidderName } = req.body;

    // Check if bidder already exists
    const existingBid = tender.bids.find(b => b.bidder.toString() === bidderId);
    if (existingBid) {
      return res.status(400).json({ success: false, message: 'Bidder already added to this tender' });
    }

    tender.bids.push({
      bidder: bidderId,
      bidderName,
      bidAmount: 0,
      currency: tender.currency,
      items: [],
      evaluations: [],
      status: 'invited',
      documents: []
    });

    tender.auditTrail.push({
      action: 'bidder_invited',
      performedBy: req.user._id,
      timestamp: new Date(),
      details: { bidderId, bidderName }
    });

    await tender.save();
    res.json({ success: true, data: tender });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Submit a bid (record bid details from a vendor)
 */
export const submitBid = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { bidIndex } = req.params;
    const tender = await Tender.findById(req.params.id);

    if (!tender) {
      return res.status(404).json({ success: false, message: 'Tender not found' });
    }

    if (!requireDirection(tender, 'issued', res)) return;

    if (!['bid-submission', 'published'].includes(tender.status)) {
      return res.status(400).json({
        success: false,
        message: 'Bids can only be submitted during bid-submission or published stage'
      });
    }

    const bid = tender.bids[parseInt(bidIndex)];
    if (!bid) {
      return res.status(404).json({ success: false, message: 'Bid not found' });
    }

    const { bidAmount, items, bidNumber, validityDays, documents, notes } = req.body;

    bid.bidAmount = bidAmount;
    bid.items = items || [];
    bid.bidNumber = bidNumber;
    bid.validityDays = validityDays;
    bid.documents = documents || [];
    bid.notes = notes;
    bid.submittedAt = new Date();
    bid.status = 'submitted';

    tender.auditTrail.push({
      action: 'bid_submitted',
      performedBy: req.user._id,
      timestamp: new Date(),
      details: { bidderName: bid.bidderName, bidAmount }
    });

    await tender.save();
    res.json({ success: true, data: tender });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Evaluate a bid (score against criteria)
 */
export const evaluateBid = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { bidIndex } = req.params;
    const tender = await Tender.findById(req.params.id);

    if (!tender) {
      return res.status(404).json({ success: false, message: 'Tender not found' });
    }

    if (!requireDirection(tender, 'issued', res)) return;

    if (tender.status !== 'evaluation') {
      return res.status(400).json({
        success: false,
        message: 'Bids can only be evaluated during evaluation stage'
      });
    }

    const bid = tender.bids[parseInt(bidIndex)];
    if (!bid) {
      return res.status(404).json({ success: false, message: 'Bid not found' });
    }

    const { evaluations } = req.body;

    bid.evaluations = evaluations.map((e: any) => ({
      ...e,
      evaluatedBy: req.user!._id,
      evaluatedAt: new Date()
    }));

    // Calculate scores
    const totalWeight = tender.evaluationCriteria.reduce((sum, c) => sum + c.weight, 0);
    let technicalScore = 0;
    let financialScore = 0;

    bid.evaluations.forEach(evaluation => {
      const criterion = tender.evaluationCriteria.find(c => c.name === evaluation.criterion);
      if (criterion) {
        const normalizedScore = (evaluation.score / criterion.maxScore) * criterion.weight;
        if (criterion.type === 'financial') {
          financialScore += normalizedScore;
        } else {
          technicalScore += normalizedScore;
        }
      }
    });

    bid.technicalScore = technicalScore;
    bid.financialScore = financialScore;
    bid.overallScore = technicalScore + financialScore;
    bid.status = 'under-review';

    tender.auditTrail.push({
      action: 'bid_evaluated',
      performedBy: req.user._id,
      timestamp: new Date(),
      details: { bidderName: bid.bidderName, overallScore: bid.overallScore }
    });

    await tender.save();
    res.json({ success: true, data: tender });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Select/shortlist a bid
 */
export const updateBidStatus = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { bidIndex } = req.params;
    const { status, rejectionReason } = req.body;
    const tender = await Tender.findById(req.params.id);

    if (!tender) {
      return res.status(404).json({ success: false, message: 'Tender not found' });
    }

    if (!requireDirection(tender, 'issued', res)) return;

    const bid = tender.bids[parseInt(bidIndex)];
    if (!bid) {
      return res.status(404).json({ success: false, message: 'Bid not found' });
    }

    // If selecting a bid, ensure only one is selected
    if (status === 'selected') {
      tender.bids.forEach(b => {
        if (b.status === 'selected') b.status = 'shortlisted';
      });
    }

    bid.status = status;
    if (rejectionReason) bid.rejectionReason = rejectionReason;

    tender.auditTrail.push({
      action: `bid_${status}`,
      performedBy: req.user._id,
      timestamp: new Date(),
      details: { bidderName: bid.bidderName, status, rejectionReason }
    });

    await tender.save();
    res.json({ success: true, data: tender });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// AWARD & WORK ORDER GENERATION
// ==========================================

/**
 * Award tender and optionally create project + work order
 */
export const awardTender = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const tender = await Tender.findById(req.params.id);
    if (!tender) {
      return res.status(404).json({ success: false, message: 'Tender not found' });
    }

    if (!requireDirection(tender, 'issued', res)) return;

    if (tender.status !== 'evaluation' && tender.status !== 'negotiation') {
      return res.status(400).json({
        success: false,
        message: 'Tender can only be awarded from evaluation or negotiation stage'
      });
    }

    const selectedBid = tender.bids.find(b => b.status === 'selected');
    if (!selectedBid) {
      return res.status(400).json({
        success: false,
        message: 'A bid must be selected before awarding'
      });
    }

    // Award the tender
    tender.status = 'awarded';
    tender.awardedBidder = selectedBid.bidder;
    tender.awardedAmount = selectedBid.bidAmount;
    tender.awardDate = new Date();
    tender.approvedBy = req.user._id;

    tender.auditTrail.push({
      action: 'tender_awarded',
      performedBy: req.user._id,
      timestamp: new Date(),
      newStatus: 'awarded',
      previousStatus: tender.status,
      details: {
        awardedTo: selectedBid.bidderName,
        amount: selectedBid.bidAmount
      }
    });

    await tender.save();

    res.json({
      success: true,
      data: tender,
      message: `Tender awarded to ${selectedBid.bidderName} for ${tender.currency} ${selectedBid.bidAmount}`
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Generate work order from awarded tender
 */
export const generateWorkOrder = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const tender = await Tender.findById(req.params.id);
    if (!tender) {
      return res.status(404).json({ success: false, message: 'Tender not found' });
    }

    if (!requireDirection(tender, 'issued', res)) return;

    if (tender.status !== 'awarded') {
      return res.status(400).json({
        success: false,
        message: 'Work order can only be generated for awarded tenders'
      });
    }

    if (!tender.awardedBidder) {
      return res.status(400).json({ success: false, message: 'No awarded bidder found' });
    }

    const selectedBid = tender.bids.find(b => b.status === 'selected');
    if (!selectedBid) {
      return res.status(400).json({ success: false, message: 'Selected bid not found' });
    }

    // Create project if not already linked
    let projectId = tender.project;
    if (!projectId) {
      const { projectName, startDate, endDate, managers, departments } = req.body;

      const project = new Project({
        name: projectName || tender.title,
        description: tender.description || tender.scopeOfWork,
        status: 'planning',
        priority: tender.priority,
        startDate: startDate || new Date(),
        endDate: endDate || new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 6 months default
        budget: tender.awardedAmount || tender.estimatedValue,
        spentBudget: 0,
        currency: tender.currency,
        progress: 0,
        autoCalculateProgress: true,
        managers: managers || [],
        team: [],
        owner: req.user._id,
        departments: departments || [tender.department],
        tags: [...(tender.tags || []), 'tender-generated'],
        milestones: [],
        risks: [],
        dependencies: [],
        requiredSkills: [],
        instructions: []
      });

      await project.save();
      projectId = project._id;
      tender.project = project._id;
    }

    // Generate work order number
    const woCount = await WorkOrder.countDocuments();
    const woNumber = `WO-${String(woCount + 1).padStart(5, '0')}`;

    // Map bid items to work order items
    const woItems = selectedBid.items.map(item => ({
      description: item.description,
      unit: item.unit,
      quantity: item.quantity,
      unitRate: item.unitRate,
      amount: item.amount
    }));

    const workOrder = new WorkOrder({
      woNumber,
      project: projectId,
      subcontractor: tender.awardedBidder,
      subcontractorName: selectedBid.bidderName,
      boq: tender.boq || undefined,
      title: `WO - ${tender.title}`,
      description: tender.scopeOfWork,
      items: woItems,
      totalAmount: tender.awardedAmount || selectedBid.bidAmount,
      totalPaid: 0,
      totalOutstanding: tender.awardedAmount || selectedBid.bidAmount,
      retentionPercentage: tender.retentionPercentage || 0,
      retentionAmount: ((tender.retentionPercentage || 0) / 100) * (tender.awardedAmount || selectedBid.bidAmount),
      currency: tender.currency,
      startDate: req.body.startDate || new Date(),
      endDate: req.body.endDate,
      paymentTerms: req.body.paymentTerms,
      status: 'issued',
      approvalStatus: 'approved',
      approvedBy: req.user._id,
      approvedDate: new Date(),
      payments: [],
      notes: `Generated from Tender: ${tender.tenderNumber}`,
      createdBy: req.user._id
    });

    await workOrder.save();

    // Update tender
    tender.workOrder = workOrder._id;
    tender.status = 'work-order-issued';
    tender.workOrderDate = new Date();

    tender.auditTrail.push({
      action: 'work_order_generated',
      performedBy: req.user._id,
      timestamp: new Date(),
      previousStatus: 'awarded',
      newStatus: 'work-order-issued',
      details: {
        workOrderNumber: woNumber,
        projectId: projectId?.toString(),
        amount: workOrder.totalAmount
      }
    });

    await tender.save();

    res.json({
      success: true,
      data: {
        tender,
        workOrder,
        projectId
      },
      message: `Work order ${woNumber} generated successfully`
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// ANALYTICS & DASHBOARD
// ==========================================

/**
 * Get tender statistics/dashboard data
 */
export const getTenderStats = async (req: Request, res: Response) => {
  try {
    const { department, direction } = req.query;
    const filter: any = {};
    if (department) filter.department = department;
    if (direction === 'issued' || direction === 'bidding') filter.direction = direction;

    const weekAhead = new Date(Date.now() + 7 * 24 * 3600000);

    const [
      total,
      statusCounts,
      directionCounts,
      totalEstimatedValue,
      totalAwardedValue,
      recentTenders,
      biddingOutcomes,
      emdExposure,
      closingSoon
    ] = await Promise.all([
      Tender.countDocuments(filter),
      Tender.aggregate([
        { $match: filter },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Tender.aggregate([
        { $match: filter },
        { $group: { _id: '$direction', count: { $sum: 1 } } }
      ]),
      Tender.aggregate([
        { $match: filter },
        { $group: { _id: null, total: { $sum: '$estimatedValue' } } }
      ]),
      Tender.aggregate([
        { $match: { ...filter, status: { $in: ['awarded', 'work-order-issued', 'in-progress', 'completed', 'won'] } } },
        { $group: { _id: null, total: { $sum: '$awardedAmount' } } }
      ]),
      Tender.find(filter)
        .sort({ createdAt: -1 })
        .limit(5)
        .select('tenderNumber title direction status estimatedValue awardedAmount createdAt'),
      // Win/loss only makes sense for tenders we bid on
      Tender.aggregate([
        { $match: { ...filter, direction: 'bidding' } },
        { $group: { _id: '$outcome.result', count: { $sum: 1 } } }
      ]),
      // EMD money currently lodged with authorities
      Tender.aggregate([
        { $match: { ...filter, direction: 'bidding', 'emd.status': 'submitted' } },
        { $group: { _id: null, total: { $sum: '$emd.amount' }, count: { $sum: 1 } } }
      ]),
      Tender.countDocuments({
        ...filter,
        direction: 'bidding',
        status: { $in: ['identified', 'go-no-go', 'preparing'] },
        submissionDeadline: { $gte: new Date(), $lte: weekAhead }
      })
    ]);

    const statusMap: Record<string, number> = {};
    statusCounts.forEach((s: any) => { statusMap[s._id] = s.count; });

    const directionMap: Record<string, number> = {};
    directionCounts.forEach((d: any) => { directionMap[d._id] = d.count; });

    const outcomeMap: Record<string, number> = {};
    biddingOutcomes.forEach((o: any) => { if (o._id) outcomeMap[o._id] = o.count; });

    const won = outcomeMap.won || 0;
    const lost = outcomeMap.lost || 0;
    const decided = won + lost;

    res.json({
      success: true,
      data: {
        total,
        byStatus: statusMap,
        byDirection: directionMap,
        totalEstimatedValue: totalEstimatedValue[0]?.total || 0,
        totalAwardedValue: totalAwardedValue[0]?.total || 0,
        savingsPercentage: totalEstimatedValue[0]?.total
          ? ((totalEstimatedValue[0].total - (totalAwardedValue[0]?.total || 0)) / totalEstimatedValue[0].total * 100).toFixed(2)
          : 0,
        recentTenders,
        bidding: {
          byOutcome: outcomeMap,
          won,
          lost,
          winRate: decided ? Number(((won / decided) * 100).toFixed(2)) : 0,
          emdLodgedAmount: emdExposure[0]?.total || 0,
          emdLodgedCount: emdExposure[0]?.count || 0,
          closingWithin7Days: closingSoon
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get tender lifecycle/timeline view
 */
export const getTenderTimeline = async (req: Request, res: Response) => {
  try {
    const tender = await Tender.findById(req.params.id)
      .select('tenderNumber title status timeline auditTrail');

    if (!tender) {
      return res.status(404).json({ success: false, message: 'Tender not found' });
    }

    res.json({
      success: true,
      data: {
        tenderNumber: tender.tenderNumber,
        title: tender.title,
        currentStatus: tender.status,
        timeline: tender.timeline,
        auditTrail: tender.auditTrail
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get bid comparison for a tender
 */
export const getBidComparison = async (req: Request, res: Response) => {
  try {
    const tender = await Tender.findById(req.params.id)
      .populate('bids.bidder', 'name company email')
      .select('tenderNumber title estimatedValue currency bids evaluationCriteria evaluationMethod');

    if (!tender) {
      return res.status(404).json({ success: false, message: 'Tender not found' });
    }

    const submittedBids = tender.bids.filter(b => b.status !== 'invited' && b.status !== 'withdrawn');

    const comparison = submittedBids.map(bid => ({
      bidder: bid.bidder,
      bidderName: bid.bidderName,
      bidAmount: bid.bidAmount,
      technicalScore: bid.technicalScore,
      financialScore: bid.financialScore,
      overallScore: bid.overallScore,
      status: bid.status,
      submittedAt: bid.submittedAt,
      varianceFromEstimate: tender.estimatedValue
        ? ((bid.bidAmount - tender.estimatedValue) / tender.estimatedValue * 100).toFixed(2) + '%'
        : 'N/A'
    }));

    // Sort by overall score (highest first)
    comparison.sort((a, b) => (b.overallScore || 0) - (a.overallScore || 0));

    res.json({
      success: true,
      data: {
        tenderNumber: tender.tenderNumber,
        title: tender.title,
        estimatedValue: tender.estimatedValue,
        currency: tender.currency,
        evaluationMethod: tender.evaluationMethod,
        evaluationCriteria: tender.evaluationCriteria,
        bids: comparison,
        lowestBid: comparison.reduce((min, b) => b.bidAmount < min.bidAmount ? b : min, comparison[0]),
        highestBid: comparison.reduce((max, b) => b.bidAmount > max.bidAmount ? b : max, comparison[0])
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// BIDDING DIRECTION — tenders we chase
// ==========================================

/**
 * Load a tender and assert it belongs to the bidding side.
 */
const loadBiddingTender = async (req: Request, res: Response): Promise<ITender | null> => {
  if (isInvalidId(req.params.id)) {
    res.status(400).json({ success: false, message: 'Invalid tender id' });
    return null;
  }
  const tender = await Tender.findById(req.params.id);
  if (!tender) {
    res.status(404).json({ success: false, message: 'Tender not found' });
    return null;
  }
  if (!requireDirection(tender, 'bidding', res)) return null;
  return tender;
};

/**
 * Replace the eligibility checklist and stamp who verified what.
 */
export const updateEligibility = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { eligibility } = req.body;
    if (!Array.isArray(eligibility)) {
      return res.status(400).json({ success: false, message: 'eligibility must be an array' });
    }

    const tender = await loadBiddingTender(req, res);
    if (!tender) return;

    const now = new Date();
    tender.eligibility = eligibility.map((item: any) => {
      const assessed = item.ourStatus && item.ourStatus !== 'unverified';
      return {
        criterion: String(item.criterion || '').trim(),
        category: item.category || 'technical',
        mandatory: item.mandatory !== false,
        ourStatus: item.ourStatus || 'unverified',
        evidenceDocuments: Array.isArray(item.evidenceDocuments) ? item.evidenceDocuments : [],
        remarks: item.remarks,
        verifiedBy: assessed ? req.user!._id : undefined,
        verifiedAt: assessed ? now : undefined
      };
    }) as any;

    recordAudit(tender, 'eligibility_updated', req.user._id, 'Eligibility checklist updated', {
      criteria: tender.eligibility.length
    });

    await tender.save();
    res.json({ success: true, data: tender.eligibility });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * Record payment of the non-refundable participation fee.
 */
export const recordTenderFee = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const tender = await loadBiddingTender(req, res);
    if (!tender) return;

    const { amount, exempted, paid, paidOn, mode, reference, documentUrl } = req.body;

    tender.tenderFee = {
      amount: Number(amount) || 0,
      exempted: !!exempted,
      paid: !!paid,
      paidOn: paid ? (paidOn ? new Date(paidOn) : new Date()) : undefined,
      mode,
      reference,
      documentUrl
    } as any;

    recordAudit(tender, 'tender_fee_recorded', req.user._id, 'Tender fee details recorded');

    await tender.save();
    res.json({ success: true, data: tender.tenderFee });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * Record or update the Earnest Money Deposit. EMD is refundable, so its
 * lifecycle (submitted, returned, forfeited) is tracked explicitly.
 */
export const recordEMD = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { amount, mode, exemptionReason, submittedOn, instrumentRef,
      issuingBank, validTill, status, returnedOn, documentUrl } = req.body;

    const allowedStatuses = ['pending', 'submitted', 'returned', 'forfeited'];
    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `status must be one of: ${allowedStatuses.join(', ')}` });
    }

    const tender = await loadBiddingTender(req, res);
    if (!tender) return;

    const previousStatus = tender.emd?.status;

    tender.emd = {
      amount: Number(amount) || 0,
      mode: mode || 'online',
      exemptionReason,
      submittedOn: submittedOn ? new Date(submittedOn) : tender.emd?.submittedOn,
      instrumentRef,
      issuingBank,
      validTill: validTill ? new Date(validTill) : undefined,
      status: status || previousStatus || 'pending',
      returnedOn: returnedOn ? new Date(returnedOn) : undefined,
      documentUrl
    } as any;

    recordAudit(tender, 'emd_updated', req.user._id, `EMD status: ${previousStatus || 'pending'} to ${tender.emd!.status}`, {
      previousStatus,
      newStatus: tender.emd!.status
    });

    await tender.save();
    res.json({ success: true, data: tender.emd });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * Record an amendment published by the authority. A corrigendum may move the
 * submission deadline, which is applied to the tender when supplied.
 */
export const addCorrigendum = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { number, issuedOn, summary, revisedSubmissionDeadline, documentUrl } = req.body;
    if (!number || !summary) {
      return res.status(400).json({ success: false, message: 'number and summary are required' });
    }

    const tender = await loadBiddingTender(req, res);
    if (!tender) return;

    tender.corrigenda.push({
      number: String(number).trim(),
      issuedOn: issuedOn ? new Date(issuedOn) : new Date(),
      summary: String(summary).trim(),
      revisedSubmissionDeadline: revisedSubmissionDeadline ? new Date(revisedSubmissionDeadline) : undefined,
      documentUrl,
      recordedBy: req.user._id,
      recordedAt: new Date()
    } as any);

    if (revisedSubmissionDeadline) {
      tender.submissionDeadline = new Date(revisedSubmissionDeadline);
    }

    recordAudit(tender, 'corrigendum_added', req.user._id, `Corrigendum ${number} recorded`);

    await tender.save();
    res.json({ success: true, data: tender.corrigenda });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * Save our technical and financial bid. finalAmount is derived from
 * baseAmount and the rebate by the model's pre-save hook.
 */
export const saveOurBid = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { technical, financial, validityDays, acknowledgementRef } = req.body;

    if (financial?.boq !== undefined && financial.boq !== null && isInvalidId(financial.boq)) {
      return res.status(400).json({ success: false, message: 'Invalid BOQ id' });
    }
    const rebate = financial?.rebatePercentage;
    if (rebate !== undefined && rebate !== null && (Number(rebate) < 0 || Number(rebate) > 100)) {
      return res.status(400).json({ success: false, message: 'rebatePercentage must be between 0 and 100' });
    }

    const tender = await loadBiddingTender(req, res);
    if (!tender) return;

    if (['won', 'lost', 'dropped', 'completed', 'cancelled'].includes(tender.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot change our bid once the tender is '${tender.status}'`
      });
    }

    const baseAmount = Number(financial?.baseAmount) || 0;

    tender.ourBid = {
      technical: {
        documents: Array.isArray(technical?.documents) ? technical.documents : (tender.ourBid?.technical?.documents || []),
        notes: technical?.notes ?? tender.ourBid?.technical?.notes,
        score: technical?.score ?? tender.ourBid?.technical?.score,
        qualified: technical?.qualified ?? tender.ourBid?.technical?.qualified,
        resultDeclaredOn: technical?.resultDeclaredOn
          ? new Date(technical.resultDeclaredOn)
          : tender.ourBid?.technical?.resultDeclaredOn
      },
      financial: {
        baseAmount,
        rebatePercentage: rebate !== undefined && rebate !== null ? Number(rebate) : undefined,
        finalAmount: baseAmount, // recomputed in the pre-save hook
        boq: financial?.boq || undefined,
        documents: Array.isArray(financial?.documents) ? financial.documents : (tender.ourBid?.financial?.documents || []),
        notes: financial?.notes ?? tender.ourBid?.financial?.notes
      },
      submittedAt: tender.ourBid?.submittedAt,
      submittedBy: tender.ourBid?.submittedBy,
      acknowledgementRef: acknowledgementRef ?? tender.ourBid?.acknowledgementRef,
      validityDays: validityDays ?? tender.ourBid?.validityDays
    } as any;

    recordAudit(tender, 'our_bid_saved', req.user._id, 'Our bid updated');

    await tender.save();
    res.json({ success: true, data: tender.ourBid });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * Record what the authority revealed when the bids were opened.
 */
export const recordOpeningResults = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { competitors, ourRank, l1Amount, l1Bidder } = req.body;
    if (competitors !== undefined && !Array.isArray(competitors)) {
      return res.status(400).json({ success: false, message: 'competitors must be an array' });
    }

    const tender = await loadBiddingTender(req, res);
    if (!tender) return;

    if (Array.isArray(competitors)) {
      tender.competitors = competitors.map((c: any) => ({
        name: String(c.name || '').trim(),
        bidAmount: c.bidAmount !== undefined ? Number(c.bidAmount) : undefined,
        rank: c.rank !== undefined ? Number(c.rank) : undefined,
        technicallyQualified: c.technicallyQualified,
        remarks: c.remarks
      })) as any;
    }

    tender.set('outcome', {
      result: tender.outcome?.result || 'awaited',
      ourRank: ourRank !== undefined ? Number(ourRank) : tender.outcome?.ourRank,
      l1Amount: l1Amount !== undefined ? Number(l1Amount) : tender.outcome?.l1Amount,
      l1Bidder: l1Bidder ?? tender.outcome?.l1Bidder,
      declaredOn: tender.outcome?.declaredOn,
      reason: tender.outcome?.reason
    });

    recordAudit(tender, 'opening_recorded', req.user._id, 'Bid opening results recorded', {
      competitors: tender.competitors.length,
      ourRank: tender.outcome?.ourRank
    });

    await tender.save();
    res.json({ success: true, data: { competitors: tender.competitors, outcome: tender.outcome } });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * Record the Letter of Award received from the authority.
 */
export const recordLetterOfAward = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const tender = await loadBiddingTender(req, res);
    if (!tender) return;

    const { number, date, awardedAmount, documentUrl, acceptedOn } = req.body;

    tender.loa = {
      received: true,
      number,
      date: date ? new Date(date) : new Date(),
      awardedAmount: awardedAmount !== undefined ? Number(awardedAmount) : tender.ourBid?.financial?.finalAmount,
      documentUrl,
      acceptedOn: acceptedOn ? new Date(acceptedOn) : undefined,
      acceptedBy: acceptedOn ? req.user._id : undefined
    } as any;

    tender.awardedAmount = tender.loa!.awardedAmount;
    tender.awardDate = tender.awardDate || tender.loa!.date;

    recordAudit(tender, 'loa_recorded', req.user._id, `Letter of Award recorded${number ? `: ${number}` : ''}`);

    await tender.save();
    res.json({ success: true, data: tender.loa });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * Record the signed agreement following the LOA.
 */
export const recordAgreement = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const tender = await loadBiddingTender(req, res);
    if (!tender) return;

    if (!tender.loa?.received) {
      return res.status(400).json({ success: false, message: 'Record the Letter of Award before the agreement' });
    }

    const { number, signedOn, commencementDate, completionDate, documentUrl } = req.body;

    tender.agreement = {
      number,
      signedOn: signedOn ? new Date(signedOn) : new Date(),
      commencementDate: commencementDate ? new Date(commencementDate) : undefined,
      completionDate: completionDate ? new Date(completionDate) : undefined,
      documentUrl
    } as any;

    recordAudit(tender, 'agreement_recorded', req.user._id, `Agreement recorded${number ? `: ${number}` : ''}`);

    await tender.save();
    res.json({ success: true, data: tender.agreement });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * Record the Performance Bank Guarantee lodged after award.
 */
export const recordPerformanceGuarantee = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { amount, percentage, mode, issuingBank, instrumentRef,
      submittedOn, validTill, status, releasedOn, documentUrl } = req.body;

    const allowedStatuses = ['pending', 'submitted', 'released', 'forfeited'];
    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `status must be one of: ${allowedStatuses.join(', ')}` });
    }

    const tender = await loadBiddingTender(req, res);
    if (!tender) return;

    // A percentage is quoted against the awarded value when no amount is given
    const base = tender.loa?.awardedAmount || tender.ourBid?.financial?.finalAmount || 0;
    const resolvedAmount = amount !== undefined
      ? Number(amount)
      : (percentage ? Math.round(base * (Number(percentage) / 100) * 100) / 100 : 0);

    tender.performanceGuarantee = {
      amount: resolvedAmount,
      percentage: percentage !== undefined ? Number(percentage) : undefined,
      mode: mode || 'bank-guarantee',
      issuingBank,
      instrumentRef,
      submittedOn: submittedOn ? new Date(submittedOn) : tender.performanceGuarantee?.submittedOn,
      validTill: validTill ? new Date(validTill) : undefined,
      status: status || tender.performanceGuarantee?.status || 'pending',
      releasedOn: releasedOn ? new Date(releasedOn) : undefined,
      documentUrl
    } as any;

    recordAudit(tender, 'pbg_updated', req.user._id, `Performance guarantee status: ${tender.performanceGuarantee!.status}`);

    await tender.save();
    res.json({ success: true, data: tender.performanceGuarantee });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * Turn a won tender into a project. Phases may be supplied so the execution
 * plan and its departmental reviews exist from day one.
 */
export const convertTenderToProject = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const tender = await loadBiddingTender(req, res);
    if (!tender) return;

    if (tender.status !== 'won' && tender.status !== 'in-progress') {
      return res.status(400).json({
        success: false,
        message: 'Only a won tender can be converted into a project'
      });
    }
    if (tender.project) {
      return res.status(409).json({
        success: false,
        message: 'This tender is already linked to a project'
      });
    }

    const contractValue = tender.loa?.awardedAmount || tender.ourBid?.financial?.finalAmount || 0;
    const startDate = tender.agreement?.commencementDate || tender.loa?.date || new Date();
    const endDate = tender.agreement?.completionDate
      || new Date(startDate.getTime() + 365 * 24 * 3600000);

    const phases = Array.isArray(req.body.phases) ? req.body.phases : [];

    const project = await Project.create({
      name: req.body.name?.trim() || tender.title,
      description: req.body.description?.trim() || tender.scopeOfWork || tender.description || tender.title,
      status: 'planning',
      priority: tender.priority,
      startDate,
      endDate,
      budget: contractValue,
      currency: tender.currency,
      owner: req.user._id,
      managers: Array.isArray(req.body.managers) ? req.body.managers : [],
      team: Array.isArray(req.body.team) ? req.body.team : [],
      departments: tender.department ? [tender.department] : [],
      client: tender.issuingAuthority?.name,
      progressMode: phases.length ? 'phase-based' : 'task-based',
      tags: ['tender', ...(tender.tags || [])]
    });

    if (phases.length) {
      const ProjectPhase = (await import('../models/ProjectPhase')).default;
      await ProjectPhase.insertMany(phases.map((phase: any, index: number) => ({
        project: project._id,
        name: String(phase.name || `Phase ${index + 1}`).trim(),
        description: phase.description?.trim(),
        order: index,
        startDate: phase.startDate ? new Date(phase.startDate) : undefined,
        endDate: phase.endDate ? new Date(phase.endDate) : undefined,
        budget: parseFloat(phase.budget) || 0,
        milestones: Array.isArray(phase.milestones) ? phase.milestones : [],
        reviewDepartments: Array.isArray(phase.reviewDepartments) ? phase.reviewDepartments : [],
        createdBy: req.user!._id
      })));
    }

    tender.project = project._id;
    recordAudit(tender, 'converted_to_project', req.user._id, `Project created from tender: ${project.name}`, {
      projectId: project._id.toString()
    });
    await tender.save();

    res.status(201).json({ success: true, data: { tender, project } });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * Compliance snapshot for a bidding tender: what still blocks submission.
 */
export const getBidReadiness = async (req: Request, res: Response) => {
  try {
    const tender = await loadBiddingTender(req, res);
    if (!tender) return;

    const blockers: string[] = [];

    if (!tender.submissionDeadline) blockers.push('Submission deadline not recorded');
    if (!tender.ourBid?.financial?.finalAmount) blockers.push('Financial bid amount not set');
    if (tender.tenderFee && !tender.tenderFee.exempted && tender.tenderFee.amount > 0 && !tender.tenderFee.paid) {
      blockers.push('Tender fee unpaid');
    }
    if (tender.emd && tender.emd.mode !== 'exempted' && tender.emd.amount > 0 && tender.emd.status === 'pending') {
      blockers.push('EMD not submitted');
    }

    const mandatory = tender.eligibility.filter(e => e.mandatory);
    const unmet = mandatory.filter(e => e.ourStatus === 'not-met' || e.ourStatus === 'unverified');
    unmet.forEach(e => blockers.push(`Eligibility unmet or unverified: ${e.criterion}`));

    const daysRemaining = tender.submissionDeadline
      ? Math.ceil((tender.submissionDeadline.getTime() - Date.now()) / (24 * 3600000))
      : null;

    res.json({
      success: true,
      data: {
        ready: blockers.length === 0,
        blockers,
        daysRemaining,
        overdue: daysRemaining !== null && daysRemaining < 0,
        eligibility: {
          total: tender.eligibility.length,
          mandatory: mandatory.length,
          met: mandatory.filter(e => e.ourStatus === 'met').length
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
