import { Request, Response } from 'express';
import Tender, { ITender, TenderStatus } from '../models/Tender';
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

// --- Valid Status Transitions ---
const VALID_TRANSITIONS: Record<TenderStatus, TenderStatus[]> = {
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

    const tenderNumber = await generateTenderNumber();

    const tender = new Tender({
      ...req.body,
      tenderNumber,
      status: 'draft',
      createdBy: req.user._id,
      auditTrail: [{
        action: 'created',
        performedBy: req.user._id,
        timestamp: new Date(),
        newStatus: 'draft',
        notes: 'Tender created'
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
      status, type, category, department, priority,
      page = '1', limit = '20', search, sortBy = 'createdAt', sortOrder = 'desc'
    } = req.query;

    const filter: any = {};
    if (status) filter.status = status;
    if (type) filter.type = type;
    if (category) filter.category = category;
    if (department) filter.department = department;
    if (priority) filter.priority = priority;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { tenderNumber: { $regex: search, $options: 'i' } },
        { referenceNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;
    const sort: any = { [sortBy as string]: sortOrder === 'asc' ? 1 : -1 };

    const [tenders, total] = await Promise.all([
      Tender.find(filter)
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

    // Only allow edits in draft or published status
    if (!['draft', 'published'].includes(tender.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot edit tender in '${tender.status}' status. Only draft or published tenders can be edited.`
      });
    }

    // Prevent changing status through update (use transition endpoint)
    const { status, tenderNumber, auditTrail, bids, ...updateData } = req.body;

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

    if (tender.status !== 'draft') {
      return res.status(400).json({
        success: false,
        message: 'Only draft tenders can be deleted. Cancel the tender instead.'
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

    // Validate transition
    const allowedTransitions = VALID_TRANSITIONS[currentStatus];
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
 * Apply side effects when transitioning status
 */
async function applyTransitionEffects(tender: ITender, newStatus: TenderStatus, userId: mongoose.Types.ObjectId) {
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
    const { department } = req.query;
    const filter: any = {};
    if (department) filter.department = department;

    const [
      total,
      statusCounts,
      totalEstimatedValue,
      totalAwardedValue,
      recentTenders
    ] = await Promise.all([
      Tender.countDocuments(filter),
      Tender.aggregate([
        { $match: filter },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Tender.aggregate([
        { $match: filter },
        { $group: { _id: null, total: { $sum: '$estimatedValue' } } }
      ]),
      Tender.aggregate([
        { $match: { ...filter, status: { $in: ['awarded', 'work-order-issued', 'in-progress', 'completed'] } } },
        { $group: { _id: null, total: { $sum: '$awardedAmount' } } }
      ]),
      Tender.find(filter)
        .sort({ createdAt: -1 })
        .limit(5)
        .select('tenderNumber title status estimatedValue awardedAmount createdAt')
    ]);

    const statusMap: Record<string, number> = {};
    statusCounts.forEach((s: any) => { statusMap[s._id] = s.count; });

    res.json({
      success: true,
      data: {
        total,
        byStatus: statusMap,
        totalEstimatedValue: totalEstimatedValue[0]?.total || 0,
        totalAwardedValue: totalAwardedValue[0]?.total || 0,
        savingsPercentage: totalEstimatedValue[0]?.total
          ? ((totalEstimatedValue[0].total - (totalAwardedValue[0]?.total || 0)) / totalEstimatedValue[0].total * 100).toFixed(2)
          : 0,
        recentTenders
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
