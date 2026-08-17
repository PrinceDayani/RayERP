//path: backend/src/models/ProjectPhase.ts

import mongoose, { Document, Schema } from 'mongoose';

export type PhaseStatus =
  | 'draft'              // Being prepared, not yet sent out
  | 'in-review'          // Review workflow is running
  | 'changes-requested'  // A reviewer sent it back
  | 'approved'           // All required departments signed off
  | 'rejected'           // Review workflow rejected
  | 'in-progress'        // Execution underway
  | 'completed'
  | 'on-hold'
  | 'cancelled';

export type PhaseReviewStatus = 'pending' | 'approved' | 'rejected' | 'changes-requested' | 'skipped';

export interface IMilestone {
  name: string;
  description?: string;
  dueDate: Date;
  status: 'pending' | 'in-progress' | 'completed' | 'delayed';
  completedDate?: Date;
}

export interface IPhaseDeliverable {
  name: string;
  description?: string;
  dueDate?: Date;
  status: 'pending' | 'submitted' | 'accepted' | 'rejected';
  documents: string[];
  submittedBy?: mongoose.Types.ObjectId;
  submittedAt?: Date;
}

/**
 * Denormalized per-department view of the review workflow. The authoritative
 * record is the WorkflowInstance in `reviewInstance`; this array is kept in
 * sync by WorkflowProjectIntegration.syncPhaseReviewSummary so phase lists and
 * dashboards do not have to join through the workflow collection.
 */
export interface IPhaseReviewSummary {
  department: mongoose.Types.ObjectId;
  departmentName: string;
  stepId?: string;
  status: PhaseReviewStatus;
  decidedBy?: mongoose.Types.ObjectId;
  decidedAt?: Date;
  comments?: string;
  round: number;
}

export interface IProjectPhase extends Document {
  project: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  order: number;
  status: PhaseStatus;

  // Schedule
  startDate?: Date;
  endDate?: Date;
  actualStartDate?: Date;
  actualEndDate?: Date;

  // Money
  budget: number;
  spentBudget: number;

  // Progress
  progress: number;
  autoCalculateProgress: boolean;

  // Content
  milestones: IMilestone[];
  deliverables: IPhaseDeliverable[];

  // Sequencing
  dependsOn: mongoose.Types.ObjectId[];

  // Review routing
  reviewDepartments: mongoose.Types.ObjectId[];
  reviewTemplate?: mongoose.Types.ObjectId;
  reviewInstance?: mongoose.Types.ObjectId;
  reviewRound: number;
  reviewSummary: IPhaseReviewSummary[];
  submittedForReviewAt?: Date;
  submittedForReviewBy?: mongoose.Types.ObjectId;
  reviewCompletedAt?: Date;

  // People (operational rail — User, per Documentation/identity-map.md)
  owner?: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;

  tags: string[];

  createdAt: Date;
  updatedAt: Date;
}

const milestoneSchema = new Schema({
  name: { type: String, required: true },
  description: String,
  dueDate: { type: Date, required: true },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'delayed'],
    default: 'pending'
  },
  completedDate: Date
}, { _id: true });

const deliverableSchema = new Schema({
  name: { type: String, required: true },
  description: String,
  dueDate: Date,
  status: {
    type: String,
    enum: ['pending', 'submitted', 'accepted', 'rejected'],
    default: 'pending'
  },
  documents: [String],
  submittedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  submittedAt: Date
}, { _id: true });

const reviewSummarySchema = new Schema({
  department: { type: Schema.Types.ObjectId, ref: 'Department', required: true },
  departmentName: { type: String, required: true },
  stepId: String,
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'changes-requested', 'skipped'],
    default: 'pending'
  },
  decidedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  decidedAt: Date,
  comments: String,
  round: { type: Number, default: 1 }
}, { _id: false });

const projectPhaseSchema = new Schema<IProjectPhase>({
  project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  order: { type: Number, required: true, default: 0 },
  status: {
    type: String,
    enum: [
      'draft', 'in-review', 'changes-requested', 'approved',
      'rejected', 'in-progress', 'completed', 'on-hold', 'cancelled'
    ],
    default: 'draft'
  },

  startDate: Date,
  endDate: Date,
  actualStartDate: Date,
  actualEndDate: Date,

  budget: { type: Number, default: 0, min: 0 },
  spentBudget: { type: Number, default: 0, min: 0 },

  progress: { type: Number, min: 0, max: 100, default: 0 },
  autoCalculateProgress: { type: Boolean, default: true },

  milestones: [milestoneSchema],
  deliverables: [deliverableSchema],

  dependsOn: [{ type: Schema.Types.ObjectId, ref: 'ProjectPhase' }],

  reviewDepartments: [{ type: Schema.Types.ObjectId, ref: 'Department' }],
  reviewTemplate: { type: Schema.Types.ObjectId, ref: 'WorkflowTemplate' },
  reviewInstance: { type: Schema.Types.ObjectId, ref: 'WorkflowInstance' },
  reviewRound: { type: Number, default: 0 },
  reviewSummary: [reviewSummarySchema],
  submittedForReviewAt: Date,
  submittedForReviewBy: { type: Schema.Types.ObjectId, ref: 'User' },
  reviewCompletedAt: Date,

  owner: { type: Schema.Types.ObjectId, ref: 'User' },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },

  tags: [String]
}, { timestamps: true });

// A project's phase order is unique so reordering cannot produce ambiguous sequences
projectPhaseSchema.index({ project: 1, order: 1 }, { unique: true });
projectPhaseSchema.index({ project: 1, status: 1 });
projectPhaseSchema.index({ status: 1 });
projectPhaseSchema.index({ reviewDepartments: 1, status: 1 });
projectPhaseSchema.index({ reviewInstance: 1 });
projectPhaseSchema.index({ 'reviewSummary.department': 1, 'reviewSummary.status': 1 });
projectPhaseSchema.index({ createdBy: 1 });

// Derive progress from milestone completion when the phase is set to auto-calculate
projectPhaseSchema.pre('save', function (next) {
  if (this.autoCalculateProgress && this.milestones.length > 0) {
    const completed = this.milestones.filter(m => m.status === 'completed').length;
    this.progress = Math.round((completed / this.milestones.length) * 100);
  }
  next();
});

export default mongoose.model<IProjectPhase>('ProjectPhase', projectPhaseSchema);
