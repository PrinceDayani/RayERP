import mongoose, { Document, Schema } from 'mongoose';

/**
 * Which side of the tender we are on.
 *
 *  'issued'  — we publish the tender, vendors bid, we evaluate and award.
 *  'bidding' — an external authority (typically government) publishes it and
 *              we prepare and submit a bid.
 *
 * The two directions share this model but use disjoint field groups and
 * disjoint status lifecycles; see TENDER_TRANSITIONS in tenderController.
 */
export type TenderDirection = 'issued' | 'bidding';

// --- Tender Lifecycle Stages ---
export type TenderStatus =
  // Shared
  | 'in-progress'        // Work is underway (linked to project)
  | 'completed'          // Work completed
  | 'cancelled'          // Tender cancelled
  // direction: 'issued'
  | 'draft'              // Tender being prepared internally
  | 'published'          // Tender published/sent to bidders
  | 'bid-submission'     // Accepting bids from vendors
  | 'evaluation'         // Evaluating received bids
  | 'negotiation'        // Negotiating with shortlisted bidders
  | 'awarded'            // Tender awarded to a bidder
  | 'work-order-issued'  // Work order issued to awarded party
  | 'no-bid'             // No bids received / all rejected
  // direction: 'bidding'
  | 'identified'         // Notice spotted, not yet assessed
  | 'go-no-go'           // Internal bid/no-bid decision under review
  | 'preparing'          // Assembling our bid
  | 'submitted'          // Bid submitted to the authority
  | 'technical-opening'  // Technical envelope opened
  | 'financial-opening'  // Financial envelope opened
  | 'won'                // We were awarded the work
  | 'lost'               // Awarded to someone else
  | 'dropped';           // We decided not to bid

export const TENDER_STATUSES: TenderStatus[] = [
  'in-progress', 'completed', 'cancelled',
  'draft', 'published', 'bid-submission', 'evaluation', 'negotiation',
  'awarded', 'work-order-issued', 'no-bid',
  'identified', 'go-no-go', 'preparing', 'submitted',
  'technical-opening', 'financial-opening', 'won', 'lost', 'dropped'
];

export type TenderType = 'open' | 'limited' | 'single-source' | 'two-envelope' | 'reverse-auction';
export type TenderCategory = 'works' | 'goods' | 'services' | 'consultancy';
export type TenderPortal = 'gem' | 'cppp' | 'state-eproc' | 'railway-ireps' | 'defence-proc' | 'offline' | 'other';

// --- Bid/Bidder Interfaces ---
export interface IBidItem {
  boqItemCode?: string;
  description: string;
  unit: string;
  quantity: number;
  unitRate: number;
  amount: number;
  remarks?: string;
}

export interface IBidEvaluation {
  criterion: string;
  maxScore: number;
  score: number;
  remarks?: string;
  evaluatedBy: mongoose.Types.ObjectId;
  evaluatedAt: Date;
}

export interface IBid {
  bidder: mongoose.Types.ObjectId;       // Reference to Contact (vendor/subcontractor)
  bidderName: string;
  bidNumber?: string;
  submittedAt?: Date;
  bidAmount: number;
  currency: string;
  validityDays?: number;
  technicalScore?: number;
  financialScore?: number;
  overallScore?: number;
  items: IBidItem[];
  evaluations: IBidEvaluation[];
  status: 'invited' | 'submitted' | 'under-review' | 'shortlisted' | 'selected' | 'rejected' | 'withdrawn';
  rejectionReason?: string;
  documents: string[];
  notes?: string;
}

// --- Evaluation Criteria ---
export interface IEvaluationCriterion {
  name: string;
  description?: string;
  maxScore: number;
  weight: number;       // percentage weight (all should sum to 100)
  type: 'technical' | 'financial' | 'experience' | 'compliance' | 'other';
}

// --- Timeline/Milestone ---
export interface ITenderTimeline {
  event: string;
  plannedDate: Date;
  actualDate?: Date;
  status: 'upcoming' | 'completed' | 'overdue' | 'skipped';
  notes?: string;
}

// ==========================================
// direction: 'bidding' — we are the bidder
// ==========================================

/** The authority that published the tender. */
export interface IIssuingAuthority {
  name: string;
  department?: string;
  officerName?: string;
  designation?: string;
  email?: string;
  phone?: string;
  address?: string;
}

/** An amendment published by the authority after the notice. */
export interface ITenderCorrigendum {
  number: string;
  issuedOn: Date;
  summary: string;
  revisedSubmissionDeadline?: Date;
  documentUrl?: string;
  recordedBy?: mongoose.Types.ObjectId;
  recordedAt: Date;
}

/** Non-refundable fee paid to download / participate. */
export interface ITenderFee {
  amount: number;
  exempted: boolean;
  paid: boolean;
  paidOn?: Date;
  mode?: 'online' | 'dd' | 'cheque' | 'cash' | 'other';
  reference?: string;
  documentUrl?: string;
}

/** Earnest Money Deposit — refundable, forfeitable on withdrawal. */
export interface IEarnestMoneyDeposit {
  amount: number;
  mode: 'dd' | 'bank-guarantee' | 'online' | 'fdr' | 'exempted';
  exemptionReason?: string;
  submittedOn?: Date;
  instrumentRef?: string;
  issuingBank?: string;
  validTill?: Date;
  status: 'pending' | 'submitted' | 'returned' | 'forfeited';
  returnedOn?: Date;
  documentUrl?: string;
}

/** One qualification requirement and how we stand against it. */
export interface IEligibilityCriterion {
  criterion: string;
  category: 'technical' | 'financial' | 'legal' | 'experience' | 'other';
  mandatory: boolean;
  ourStatus: 'met' | 'not-met' | 'partial' | 'not-applicable' | 'unverified';
  evidenceDocuments: string[];
  remarks?: string;
  verifiedBy?: mongoose.Types.ObjectId;
  verifiedAt?: Date;
}

/** The bid we submit. */
export interface IOurBid {
  technical: {
    documents: string[];
    notes?: string;
    score?: number;
    qualified?: boolean;
    resultDeclaredOn?: Date;
  };
  financial: {
    baseAmount: number;
    rebatePercentage?: number;
    finalAmount: number;
    boq?: mongoose.Types.ObjectId;
    documents: string[];
    notes?: string;
  };
  submittedAt?: Date;
  submittedBy?: mongoose.Types.ObjectId;
  acknowledgementRef?: string;
  validityDays?: number;
}

/** A rival bidder, as revealed at opening. */
export interface ICompetitorBid {
  name: string;
  bidAmount?: number;
  rank?: number;
  technicallyQualified?: boolean;
  remarks?: string;
}

/** Result of the tender from our side. */
export interface ITenderOutcome {
  result: 'awaited' | 'technically-qualified' | 'technically-disqualified' | 'won' | 'lost' | 'cancelled-by-authority';
  ourRank?: number;
  l1Amount?: number;
  l1Bidder?: string;
  declaredOn?: Date;
  reason?: string;
}

/** Letter of Award issued to us. */
export interface ILetterOfAward {
  received: boolean;
  number?: string;
  date?: Date;
  awardedAmount?: number;
  documentUrl?: string;
  acceptedOn?: Date;
  acceptedBy?: mongoose.Types.ObjectId;
}

/** Signed contract following the LOA. */
export interface IAgreementRecord {
  number?: string;
  signedOn?: Date;
  commencementDate?: Date;
  completionDate?: Date;
  documentUrl?: string;
}

/** Performance Bank Guarantee lodged after award. */
export interface IPerformanceGuarantee {
  amount: number;
  percentage?: number;
  mode: 'bank-guarantee' | 'dd' | 'fdr' | 'online' | 'not-required';
  issuingBank?: string;
  instrumentRef?: string;
  submittedOn?: Date;
  validTill?: Date;
  status: 'pending' | 'submitted' | 'released' | 'forfeited';
  releasedOn?: Date;
  documentUrl?: string;
}

// --- Audit Entry ---
export interface ITenderAuditEntry {
  action: string;
  performedBy: mongoose.Types.ObjectId;
  timestamp: Date;
  previousStatus?: string;
  newStatus?: string;
  details?: Record<string, any>;
  notes?: string;
}

// --- Main Tender Interface ---
export interface ITender extends Document {
  tenderNumber: string;
  direction: TenderDirection;
  title: string;
  description?: string;
  type: TenderType;
  category: TenderCategory;
  status: TenderStatus;

  // Scope & Requirements
  scopeOfWork?: string;
  eligibilityCriteria?: string;
  termsAndConditions?: string;
  specialInstructions?: string;

  // Financial
  estimatedValue: number;
  currency: string;
  earnestMoneyDeposit?: number;       // EMD amount
  securityDeposit?: number;           // SD percentage or amount
  retentionPercentage?: number;

  // Dates
  publishDate?: Date;
  preBidMeetingDate?: Date;
  submissionDeadline?: Date;
  openingDate?: Date;
  evaluationDeadline?: Date;
  awardDate?: Date;
  workOrderDate?: Date;

  // Relationships
  project?: mongoose.Types.ObjectId;         // Linked project (created after award)
  boq?: mongoose.Types.ObjectId;             // BOQ for this tender
  workOrder?: mongoose.Types.ObjectId;       // Work order issued after award
  department?: mongoose.Types.ObjectId;
  
  // People
  createdBy: mongoose.Types.ObjectId;
  tenderCommittee: mongoose.Types.ObjectId[];
  approvedBy?: mongoose.Types.ObjectId;

  // --- direction: 'issued' ---
  bids: IBid[];
  awardedBidder?: mongoose.Types.ObjectId;
  awardedAmount?: number;
  evaluationCriteria: IEvaluationCriterion[];
  evaluationMethod: 'lowest-price' | 'quality-cost-based' | 'quality-based' | 'fixed-budget';

  // --- direction: 'bidding' ---
  issuingAuthority?: IIssuingAuthority;
  portal?: TenderPortal;
  portalTenderId?: string;
  portalUrl?: string;
  tenderNoticeNumber?: string;
  corrigenda: ITenderCorrigendum[];
  tenderFee?: ITenderFee;
  emd?: IEarnestMoneyDeposit;
  bidSecurityDeclaration: boolean;
  eligibility: IEligibilityCriterion[];
  ourBid?: IOurBid;
  competitors: ICompetitorBid[];
  outcome?: ITenderOutcome;
  loa?: ILetterOfAward;
  agreement?: IAgreementRecord;
  performanceGuarantee?: IPerformanceGuarantee;
  technicalOpeningDate?: Date;
  financialOpeningDate?: Date;
  goNoGoWorkflowInstance?: mongoose.Types.ObjectId;

  // Timeline
  timeline: ITenderTimeline[];

  // Documents & Attachments
  documents: string[];
  tenderDocumentUrl?: string;

  // Audit
  auditTrail: ITenderAuditEntry[];

  // Tags & Metadata
  tags: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  location?: string;
  referenceNumber?: string;

  createdAt: Date;
  updatedAt: Date;
}

// --- Schemas ---

const bidItemSchema = new Schema({
  boqItemCode: String,
  description: { type: String, required: true },
  unit: { type: String, required: true },
  quantity: { type: Number, required: true },
  unitRate: { type: Number, required: true },
  amount: { type: Number, required: true },
  remarks: String
}, { _id: false });

const bidEvaluationSchema = new Schema({
  criterion: { type: String, required: true },
  maxScore: { type: Number, required: true },
  score: { type: Number, required: true, min: 0 },
  remarks: String,
  evaluatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  evaluatedAt: { type: Date, default: Date.now }
}, { _id: false });

const bidSchema = new Schema({
  bidder: { type: Schema.Types.ObjectId, ref: 'Contact', required: true },
  bidderName: { type: String, required: true },
  bidNumber: String,
  submittedAt: Date,
  bidAmount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  validityDays: Number,
  technicalScore: Number,
  financialScore: Number,
  overallScore: Number,
  items: [bidItemSchema],
  evaluations: [bidEvaluationSchema],
  status: {
    type: String,
    enum: ['invited', 'submitted', 'under-review', 'shortlisted', 'selected', 'rejected', 'withdrawn'],
    default: 'invited'
  },
  rejectionReason: String,
  documents: [String],
  notes: String
});

const evaluationCriterionSchema = new Schema({
  name: { type: String, required: true },
  description: String,
  maxScore: { type: Number, required: true },
  weight: { type: Number, required: true },
  type: {
    type: String,
    enum: ['technical', 'financial', 'experience', 'compliance', 'other'],
    required: true
  }
}, { _id: false });

const tenderTimelineSchema = new Schema({
  event: { type: String, required: true },
  plannedDate: { type: Date, required: true },
  actualDate: Date,
  status: {
    type: String,
    enum: ['upcoming', 'completed', 'overdue', 'skipped'],
    default: 'upcoming'
  },
  notes: String
}, { _id: false });

// --- Bidding-direction sub-schemas ---

const issuingAuthoritySchema = new Schema({
  name: { type: String, required: true, trim: true },
  department: String,
  officerName: String,
  designation: String,
  email: { type: String, lowercase: true, trim: true },
  phone: String,
  address: String
}, { _id: false });

const corrigendumSchema = new Schema({
  number: { type: String, required: true },
  issuedOn: { type: Date, required: true },
  summary: { type: String, required: true },
  revisedSubmissionDeadline: Date,
  documentUrl: String,
  recordedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  recordedAt: { type: Date, default: Date.now }
}, { _id: true });

const tenderFeeSchema = new Schema({
  amount: { type: Number, default: 0, min: 0 },
  exempted: { type: Boolean, default: false },
  paid: { type: Boolean, default: false },
  paidOn: Date,
  mode: { type: String, enum: ['online', 'dd', 'cheque', 'cash', 'other'] },
  reference: String,
  documentUrl: String
}, { _id: false });

const emdSchema = new Schema({
  amount: { type: Number, default: 0, min: 0 },
  mode: {
    type: String,
    enum: ['dd', 'bank-guarantee', 'online', 'fdr', 'exempted'],
    default: 'online'
  },
  exemptionReason: String,
  submittedOn: Date,
  instrumentRef: String,
  issuingBank: String,
  validTill: Date,
  status: {
    type: String,
    enum: ['pending', 'submitted', 'returned', 'forfeited'],
    default: 'pending'
  },
  returnedOn: Date,
  documentUrl: String
}, { _id: false });

const eligibilitySchema = new Schema({
  criterion: { type: String, required: true },
  category: {
    type: String,
    enum: ['technical', 'financial', 'legal', 'experience', 'other'],
    default: 'technical'
  },
  mandatory: { type: Boolean, default: true },
  ourStatus: {
    type: String,
    enum: ['met', 'not-met', 'partial', 'not-applicable', 'unverified'],
    default: 'unverified'
  },
  evidenceDocuments: [String],
  remarks: String,
  verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  verifiedAt: Date
}, { _id: true });

const ourBidSchema = new Schema({
  technical: {
    documents: [String],
    notes: String,
    score: Number,
    qualified: Boolean,
    resultDeclaredOn: Date
  },
  financial: {
    baseAmount: { type: Number, default: 0, min: 0 },
    rebatePercentage: { type: Number, min: 0, max: 100 },
    finalAmount: { type: Number, default: 0, min: 0 },
    boq: { type: Schema.Types.ObjectId, ref: 'BOQ' },
    documents: [String],
    notes: String
  },
  submittedAt: Date,
  submittedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  acknowledgementRef: String,
  validityDays: Number
}, { _id: false });

const competitorSchema = new Schema({
  name: { type: String, required: true },
  bidAmount: Number,
  rank: Number,
  technicallyQualified: Boolean,
  remarks: String
}, { _id: true });

const outcomeSchema = new Schema({
  result: {
    type: String,
    enum: ['awaited', 'technically-qualified', 'technically-disqualified', 'won', 'lost', 'cancelled-by-authority'],
    default: 'awaited'
  },
  ourRank: Number,
  l1Amount: Number,
  l1Bidder: String,
  declaredOn: Date,
  reason: String
}, { _id: false });

const loaSchema = new Schema({
  received: { type: Boolean, default: false },
  number: String,
  date: Date,
  awardedAmount: Number,
  documentUrl: String,
  acceptedOn: Date,
  acceptedBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, { _id: false });

const agreementSchema = new Schema({
  number: String,
  signedOn: Date,
  commencementDate: Date,
  completionDate: Date,
  documentUrl: String
}, { _id: false });

const performanceGuaranteeSchema = new Schema({
  amount: { type: Number, default: 0, min: 0 },
  percentage: { type: Number, min: 0, max: 100 },
  mode: {
    type: String,
    enum: ['bank-guarantee', 'dd', 'fdr', 'online', 'not-required'],
    default: 'bank-guarantee'
  },
  issuingBank: String,
  instrumentRef: String,
  submittedOn: Date,
  validTill: Date,
  status: {
    type: String,
    enum: ['pending', 'submitted', 'released', 'forfeited'],
    default: 'pending'
  },
  releasedOn: Date,
  documentUrl: String
}, { _id: false });

const tenderAuditSchema = new Schema({
  action: { type: String, required: true },
  performedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  timestamp: { type: Date, default: Date.now },
  previousStatus: String,
  newStatus: String,
  details: Schema.Types.Mixed,
  notes: String
}, { _id: false });

// --- Main Tender Schema ---
const tenderSchema = new Schema<ITender>({
  tenderNumber: { type: String, required: true, unique: true },
  direction: {
    type: String,
    enum: ['issued', 'bidding'],
    default: 'issued',
    required: true
  },
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  type: {
    type: String,
    enum: ['open', 'limited', 'single-source', 'two-envelope', 'reverse-auction'],
    required: true
  },
  category: {
    type: String,
    enum: ['works', 'goods', 'services', 'consultancy'],
    required: true
  },
  status: {
    type: String,
    enum: TENDER_STATUSES,
    default: 'draft'
  },

  // Scope
  scopeOfWork: { type: String },
  eligibilityCriteria: String,
  termsAndConditions: String,
  specialInstructions: String,

  // Financial
  estimatedValue: { type: Number, default: 0 },
  currency: { type: String, default: 'INR' },
  earnestMoneyDeposit: Number,
  securityDeposit: Number,
  retentionPercentage: Number,

  // Dates
  publishDate: Date,
  preBidMeetingDate: Date,
  submissionDeadline: Date,
  openingDate: Date,
  evaluationDeadline: Date,
  awardDate: Date,
  workOrderDate: Date,

  // Relationships
  project: { type: Schema.Types.ObjectId, ref: 'Project' },
  boq: { type: Schema.Types.ObjectId, ref: 'BOQ' },
  workOrder: { type: Schema.Types.ObjectId, ref: 'WorkOrder' },
  department: { type: Schema.Types.ObjectId, ref: 'Department' },

  // People
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  tenderCommittee: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },

  // --- direction: 'issued' ---
  bids: [bidSchema],
  awardedBidder: { type: Schema.Types.ObjectId, ref: 'Contact' },
  awardedAmount: Number,
  evaluationCriteria: [evaluationCriterionSchema],
  evaluationMethod: {
    type: String,
    enum: ['lowest-price', 'quality-cost-based', 'quality-based', 'fixed-budget'],
    default: 'quality-cost-based'
  },

  // --- direction: 'bidding' ---
  issuingAuthority: issuingAuthoritySchema,
  portal: {
    type: String,
    enum: ['gem', 'cppp', 'state-eproc', 'railway-ireps', 'defence-proc', 'offline', 'other']
  },
  portalTenderId: { type: String, trim: true },
  portalUrl: String,
  tenderNoticeNumber: { type: String, trim: true },
  corrigenda: [corrigendumSchema],
  tenderFee: tenderFeeSchema,
  emd: emdSchema,
  bidSecurityDeclaration: { type: Boolean, default: false },
  eligibility: [eligibilitySchema],
  ourBid: ourBidSchema,
  competitors: [competitorSchema],
  outcome: outcomeSchema,
  loa: loaSchema,
  agreement: agreementSchema,
  performanceGuarantee: performanceGuaranteeSchema,
  technicalOpeningDate: Date,
  financialOpeningDate: Date,
  goNoGoWorkflowInstance: { type: Schema.Types.ObjectId, ref: 'WorkflowInstance' },

  // Timeline
  timeline: [tenderTimelineSchema],

  // Documents
  documents: [String],
  tenderDocumentUrl: String,

  // Audit
  auditTrail: [tenderAuditSchema],

  // Metadata
  tags: [String],
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  location: String,
  referenceNumber: String
}, {
  timestamps: true
});

// --- Indexes ---
tenderSchema.index({ tenderNumber: 1 });
tenderSchema.index({ status: 1 });
tenderSchema.index({ department: 1 });
tenderSchema.index({ createdBy: 1 });
tenderSchema.index({ submissionDeadline: 1 });
tenderSchema.index({ 'bids.bidder': 1 });
tenderSchema.index({ awardedBidder: 1 });
tenderSchema.index({ direction: 1, status: 1 });
tenderSchema.index({ direction: 1, submissionDeadline: 1 });
tenderSchema.index({ 'outcome.result': 1 });
tenderSchema.index({ 'emd.status': 1, 'emd.validTill': 1 });
tenderSchema.index({ portal: 1, portalTenderId: 1 });

// --- Pre-save: Auto-calculate bid amounts ---
tenderSchema.pre('save', function (next) {
  // Received bids (direction: 'issued')
  this.bids.forEach(bid => {
    if (bid.items && bid.items.length > 0) {
      bid.bidAmount = bid.items.reduce((sum, item) => sum + item.amount, 0);
    }
  });

  // Our own bid (direction: 'bidding') — a rebate is quoted off the base amount
  if (this.ourBid?.financial) {
    const { baseAmount, rebatePercentage } = this.ourBid.financial;
    if (typeof baseAmount === 'number') {
      this.ourBid.financial.finalAmount = rebatePercentage
        ? Math.round(baseAmount * (1 - rebatePercentage / 100) * 100) / 100
        : baseAmount;
    }
  }

  next();
});

export default mongoose.model<ITender>('Tender', tenderSchema);
