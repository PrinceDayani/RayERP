import mongoose, { Document, Schema } from 'mongoose';

// --- Tender Lifecycle Stages ---
export type TenderStatus =
  | 'draft'              // Tender being prepared internally
  | 'published'          // Tender published/sent to bidders
  | 'bid-submission'     // Accepting bids from vendors
  | 'evaluation'         // Evaluating received bids
  | 'negotiation'        // Negotiating with shortlisted bidders
  | 'awarded'            // Tender awarded to a bidder
  | 'work-order-issued'  // Work order issued to awarded party
  | 'in-progress'        // Work is underway (linked to project)
  | 'completed'          // Work completed
  | 'cancelled'          // Tender cancelled
  | 'no-bid';            // No bids received / all rejected

export type TenderType = 'open' | 'limited' | 'single-source' | 'two-envelope' | 'reverse-auction';
export type TenderCategory = 'works' | 'goods' | 'services' | 'consultancy';

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

  // Bids
  bids: IBid[];
  awardedBidder?: mongoose.Types.ObjectId;
  awardedAmount?: number;

  // Evaluation
  evaluationCriteria: IEvaluationCriterion[];
  evaluationMethod: 'lowest-price' | 'quality-cost-based' | 'quality-based' | 'fixed-budget';

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
    enum: [
      'draft', 'published', 'bid-submission', 'evaluation', 'negotiation',
      'awarded', 'work-order-issued', 'in-progress', 'completed', 'cancelled', 'no-bid'
    ],
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

  // Bids
  bids: [bidSchema],
  awardedBidder: { type: Schema.Types.ObjectId, ref: 'Contact' },
  awardedAmount: Number,

  // Evaluation
  evaluationCriteria: [evaluationCriterionSchema],
  evaluationMethod: {
    type: String,
    enum: ['lowest-price', 'quality-cost-based', 'quality-based', 'fixed-budget'],
    default: 'quality-cost-based'
  },

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

// --- Pre-save: Auto-calculate bid amounts ---
tenderSchema.pre('save', function (next) {
  // Calculate bid amounts from items if items exist
  this.bids.forEach(bid => {
    if (bid.items && bid.items.length > 0) {
      bid.bidAmount = bid.items.reduce((sum, item) => sum + item.amount, 0);
    }
  });
  next();
});

export default mongoose.model<ITender>('Tender', tenderSchema);
