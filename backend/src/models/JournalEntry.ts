import mongoose, { Document, Schema } from 'mongoose';

export interface IJournalEntryLine {
  accountId: mongoose.Types.ObjectId;
  description: string;
  debit: number;
  credit: number;
  projectId?: mongoose.Types.ObjectId;
  costCenterId?: mongoose.Types.ObjectId;
  boqItemId?: mongoose.Types.ObjectId;
  costHead?: 'material' | 'labour' | 'equipment' | 'subcontractor' | 'overhead';
  department?: string;
}

export interface IJournalEntry extends Document {
  entryNumber: string;
  date: Date;
  reference: string;
  description: string;
  fiscalYear: string;
  sourceModule: 'manual' | 'ap' | 'ar' | 'payroll' | 'inventory' | 'assets' | 'billing';
  lines: IJournalEntryLine[];
  totalDebit: number;
  totalCredit: number;
  status: 'draft' | 'reviewed' | 'approved' | 'posted';
  isPosted: boolean;
  isAutoReversing: boolean;
  reversalDate?: Date;
  reversedEntryId?: mongoose.Types.ObjectId;
  projectId?: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  reviewedBy?: mongoose.Types.ObjectId;
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  postedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const JournalEntryLineSchema = new Schema<IJournalEntryLine>({
  accountId: {
    type: Schema.Types.ObjectId,
    ref: 'ChartOfAccounts',
    required: true
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
  projectId: {
    type: Schema.Types.ObjectId,
    ref: 'Project'
  },
  costCenterId: {
    type: Schema.Types.ObjectId,
    ref: 'CostCenter'
  },
  boqItemId: {
    type: Schema.Types.ObjectId,
    ref: 'BOQItem'
  },
  costHead: {
    type: String,
    enum: ['material', 'labour', 'equipment', 'subcontractor', 'overhead']
  },
  department: {
    type: String,
    trim: true
  }
});

const JournalEntrySchema = new Schema<IJournalEntry>({
  entryNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  reference: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  fiscalYear: {
    type: String,
    required: true,
    trim: true
  },
  sourceModule: {
    type: String,
    required: true,
    enum: ['manual', 'ap', 'ar', 'payroll', 'inventory', 'assets', 'billing'],
    default: 'manual'
  },
  lines: [JournalEntryLineSchema],
  totalDebit: {
    type: Number,
    required: true,
    min: 0
  },
  totalCredit: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    required: true,
    enum: ['draft', 'reviewed', 'approved', 'posted'],
    default: 'draft'
  },
  isPosted: {
    type: Boolean,
    default: false
  },
  isAutoReversing: {
    type: Boolean,
    default: false
  },
  reversalDate: {
    type: Date
  },
  reversedEntryId: {
    type: Schema.Types.ObjectId,
    ref: 'JournalEntry'
  },
  projectId: {
    type: Schema.Types.ObjectId,
    ref: 'Project'
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reviewedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  postedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Validation to ensure debit equals credit
JournalEntrySchema.pre('save', function(next) {
  this.totalDebit = this.lines.reduce((sum, line) => sum + line.debit, 0);
  this.totalCredit = this.lines.reduce((sum, line) => sum + line.credit, 0);
  
  if (Math.abs(this.totalDebit - this.totalCredit) > 0.01) {
    return next(new Error('Total debit must equal total credit'));
  }
  
  next();
});

JournalEntrySchema.index({ entryNumber: 1 });
JournalEntrySchema.index({ date: 1, status: 1 });
JournalEntrySchema.index({ fiscalYear: 1 });
JournalEntrySchema.index({ projectId: 1 });
JournalEntrySchema.index({ sourceModule: 1 });

export const JournalEntry = mongoose.model<IJournalEntry>('JournalEntry', JournalEntrySchema);