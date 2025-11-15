import mongoose, { Document, Schema } from 'mongoose';

export interface IBudgetRevision {
  revisionNumber: number;
  revisionDate: Date;
  previousAmount: number;
  newAmount: number;
  reason: string;
  revisedBy: mongoose.Types.ObjectId;
}

export interface IBudgetApproval {
  level: number;
  approver: mongoose.Types.ObjectId;
  status: 'pending' | 'approved' | 'rejected';
  comments?: string;
  date?: Date;
}

export interface IPeriodBreakdown {
  period: string; // 'Q1', 'Q2', 'Jan', 'Feb', etc.
  budgetAmount: number;
  actualAmount: number;
  variance: number;
}

export interface IGLBudget extends Document {
  accountId: mongoose.Types.ObjectId;
  fiscalYear: string;
  budgetAmount: number;
  actualAmount: number;
  variance: number;
  utilizationPercent: number;
  period: 'monthly' | 'quarterly' | 'yearly';
  periodBreakdown: IPeriodBreakdown[];
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'frozen';
  revisions: IBudgetRevision[];
  approvals: IBudgetApproval[];
  alerts: {
    threshold80: boolean;
    threshold90: boolean;
    threshold100: boolean;
    overspending: boolean;
  };
  templateId?: mongoose.Types.ObjectId;
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const GLBudgetSchema = new Schema<IGLBudget>({
  accountId: { type: Schema.Types.ObjectId, ref: 'Account', required: true },
  fiscalYear: { type: String, required: true, trim: true },
  budgetAmount: { type: Number, required: true, min: 0 },
  actualAmount: { type: Number, default: 0 },
  variance: { type: Number, default: 0 },
  utilizationPercent: { type: Number, default: 0 },
  period: { type: String, enum: ['monthly', 'quarterly', 'yearly'], default: 'yearly' },
  periodBreakdown: [{
    period: String,
    budgetAmount: Number,
    actualAmount: { type: Number, default: 0 },
    variance: { type: Number, default: 0 }
  }],
  status: { type: String, enum: ['draft', 'pending_approval', 'approved', 'rejected', 'frozen'], default: 'draft' },
  revisions: [{
    revisionNumber: Number,
    revisionDate: { type: Date, default: Date.now },
    previousAmount: Number,
    newAmount: Number,
    reason: String,
    revisedBy: { type: Schema.Types.ObjectId, ref: 'User' }
  }],
  approvals: [{
    level: Number,
    approver: { type: Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    comments: String,
    date: Date
  }],
  alerts: {
    threshold80: { type: Boolean, default: false },
    threshold90: { type: Boolean, default: false },
    threshold100: { type: Boolean, default: false },
    overspending: { type: Boolean, default: false }
  },
  templateId: { type: Schema.Types.ObjectId, ref: 'BudgetTemplate' },
  notes: String,
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

GLBudgetSchema.index({ accountId: 1, fiscalYear: 1, period: 1 });

export const GLBudget = mongoose.model<IGLBudget>('GLBudget', GLBudgetSchema);
