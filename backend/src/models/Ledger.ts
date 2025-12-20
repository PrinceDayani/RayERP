import mongoose, { Document, Schema } from 'mongoose';

// Transaction history for accounts (audit trail)
export interface ILedger extends Document {
  accountId: mongoose.Types.ObjectId;
  date: Date;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  journalEntryId: mongoose.Types.ObjectId;
  reference: string;
  department?: mongoose.Types.ObjectId;
  costCenter?: mongoose.Types.ObjectId;
  cashFlowCategory?: 'OPERATING' | 'INVESTING' | 'FINANCING' | 'NON_CASH';
  suggestedCategory?: 'OPERATING' | 'INVESTING' | 'FINANCING' | 'NON_CASH';
  categoryConfidence?: number;
  needsReview?: boolean;
  manualCategoryOverride?: boolean;
  overriddenBy?: mongoose.Types.ObjectId;
  overriddenAt?: Date;
  overrideReason?: string;
  categoryHistory?: Array<{
    from: string;
    to: string;
    changedBy: mongoose.Types.ObjectId;
    changedAt: Date;
    reason?: string;
  }>;
  createdAt: Date;
}

const LedgerSchema = new Schema<ILedger>({
  accountId: {
    type: Schema.Types.ObjectId,
    ref: 'ChartOfAccount',
    required: true,
    index: true
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  debit: {
    type: Number,
    default: 0,
    min: 0
  },
  credit: {
    type: Number,
    default: 0,
    min: 0
  },
  balance: {
    type: Number,
    required: true
  },
  journalEntryId: {
    type: Schema.Types.ObjectId,
    ref: 'JournalEntry',
    required: true
  },
  reference: {
    type: String,
    required: true,
    trim: true
  },
  department: {
    type: Schema.Types.ObjectId,
    ref: 'Department',
    index: true
  },
  costCenter: {
    type: Schema.Types.ObjectId,
    ref: 'CostCenter',
    index: true
  },
  cashFlowCategory: {
    type: String,
    enum: ['OPERATING', 'INVESTING', 'FINANCING', 'NON_CASH'],
    index: true
  },
  suggestedCategory: {
    type: String,
    enum: ['OPERATING', 'INVESTING', 'FINANCING', 'NON_CASH']
  },
  categoryConfidence: {
    type: Number,
    min: 0,
    max: 1
  },
  needsReview: {
    type: Boolean,
    default: false,
    index: true
  },
  manualCategoryOverride: {
    type: Boolean,
    default: false
  },
  overriddenBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  overriddenAt: Date,
  overrideReason: String,
  categoryHistory: [{
    from: String,
    to: String,
    changedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    changedAt: Date,
    reason: String
  }]
}, {
  timestamps: true
});

LedgerSchema.index({ needsReview: 1, date: -1 });
LedgerSchema.index({ cashFlowCategory: 1, date: 1 });

LedgerSchema.index({ accountId: 1, date: 1 });
LedgerSchema.index({ journalEntryId: 1 });

// Critical indexes for P&L performance
LedgerSchema.index({ date: 1, accountId: 1 }); // Compound for date range queries
LedgerSchema.index({ accountId: 1, date: -1, credit: 1, debit: 1 }); // Covering index for aggregation

export const Ledger = mongoose.model<ILedger>('Ledger', LedgerSchema);