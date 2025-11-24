import mongoose, { Schema, Document } from 'mongoose';

export interface IJournalEntryLine {
  account: mongoose.Types.ObjectId;
  accountId: mongoose.Types.ObjectId; // Alias for account
  debit: number;
  credit: number;
  description?: string;
  costCenter?: mongoose.Types.ObjectId | string;
  department?: mongoose.Types.ObjectId;
  project?: mongoose.Types.ObjectId;
  currency?: string;
  exchangeRate?: number;
  foreignDebit?: number;
  foreignCredit?: number;
  quantity?: number; // For statistical entries
  unit?: string; // For statistical entries
}

export interface IJournalEntry extends Document {
  entryNumber: string;
  entryType: 'MANUAL' | 'RECURRING' | 'REVERSING' | 'TEMPLATE' | 'INTER_COMPANY' | 'CONSOLIDATION' | 'TAX' | 'STATISTICAL';
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'POSTED' | 'REVERSED' | 'CANCELLED';
  
  // Dates
  date: Date; // Alias for entryDate
  entryDate: Date;
  postingDate?: Date;
  reversalDate?: Date;
  periodYear: number;
  periodMonth: number;
  updatedAt?: Date;
  
  // Description
  description: string;
  reference?: string;
  
  // Posted status
  isPosted: boolean;
  
  // Lines
  lines: IJournalEntryLine[];
  totalDebit: number;
  totalCredit: number;
  
  // Recurring
  isRecurring: boolean;
  recurringFrequency?: 'MONTHLY' | 'QUARTERLY' | 'SEMI_ANNUALLY' | 'ANNUALLY';
  recurringStartDate?: Date;
  recurringEndDate?: Date;
  nextRecurringDate?: Date;
  autoPost: boolean;
  
  // Reversing
  isReversing: boolean;
  reversalPeriodYear?: number;
  reversalPeriodMonth?: number;
  reversedEntryId?: mongoose.Types.ObjectId;
  originalEntryId?: mongoose.Types.ObjectId;
  
  // Template
  templateId?: mongoose.Types.ObjectId;
  templateName?: string;
  
  // Inter-company
  isInterCompany: boolean;
  sourceCompany?: string;
  targetCompany?: string;
  matchingEntryId?: mongoose.Types.ObjectId;
  
  // Approval
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvalWorkflow: Array<{
    level: number;
    approverId: mongoose.Types.ObjectId;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    date?: Date;
    comments?: string;
  }>;
  
  // Budget Check
  budgetCheckPerformed: boolean;
  budgetWarnings: Array<{
    account: mongoose.Types.ObjectId;
    budgetAmount: number;
    actualAmount: number;
    variance: number;
    message: string;
  }>;
  
  // Attachments
  attachments: string[];
  
  // Source
  sourceType?: 'INVOICE' | 'VOUCHER' | 'PAYROLL' | 'DEPRECIATION' | 'ACCRUAL' | 'MANUAL';
  sourceId?: mongoose.Types.ObjectId;
  
  // Audit
  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  postedBy?: mongoose.Types.ObjectId;
  reversedBy?: mongoose.Types.ObjectId;
  reversalReason?: string;
  createdAt?: Date;
  
  // Period Lock
  isLocked: boolean;
  lockedBy?: mongoose.Types.ObjectId;
  lockedDate?: Date;
  
  // Change History
  changeHistory: Array<{
    changedBy: mongoose.Types.ObjectId;
    changedAt: Date;
    field: string;
    oldValue: any;
    newValue: any;
  }>;
}

const JournalEntrySchema = new Schema<IJournalEntry>({
  entryNumber: { type: String, required: true, unique: true },
  entryType: { type: String, enum: ['MANUAL', 'RECURRING', 'REVERSING', 'TEMPLATE', 'INTER_COMPANY', 'CONSOLIDATION', 'TAX', 'STATISTICAL'], default: 'MANUAL' },
  status: { type: String, enum: ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'POSTED', 'REVERSED', 'CANCELLED'], default: 'DRAFT' },
  
  date: { type: Date },
  entryDate: { type: Date, required: true },
  postingDate: Date,
  reversalDate: Date,
  periodYear: { type: Number, required: true },
  periodMonth: { type: Number, required: true },
  
  isPosted: { type: Boolean, default: false },
  
  description: { type: String, required: true },
  reference: String,
  
  lines: [{
    account: { type: Schema.Types.ObjectId, ref: 'Account', required: true },
    debit: { type: Number, default: 0 },
    credit: { type: Number, default: 0 },
    description: String,
    costCenter: { type: Schema.Types.ObjectId, ref: 'CostCenter' },
    department: { type: Schema.Types.ObjectId, ref: 'Department' },
    project: { type: Schema.Types.ObjectId, ref: 'Project' },
    currency: String,
    exchangeRate: Number,
    foreignDebit: Number,
    foreignCredit: Number,
    quantity: Number,
    unit: String
  }],
  totalDebit: { type: Number, required: true },
  totalCredit: { type: Number, required: true },
  
  isRecurring: { type: Boolean, default: false },
  recurringFrequency: { type: String, enum: ['MONTHLY', 'QUARTERLY', 'SEMI_ANNUALLY', 'ANNUALLY'] },
  recurringStartDate: Date,
  recurringEndDate: Date,
  nextRecurringDate: Date,
  autoPost: { type: Boolean, default: false },
  
  isReversing: { type: Boolean, default: false },
  reversalPeriodYear: Number,
  reversalPeriodMonth: Number,
  reversedEntryId: { type: Schema.Types.ObjectId, ref: 'JournalEntry' },
  originalEntryId: { type: Schema.Types.ObjectId, ref: 'JournalEntry' },
  
  templateId: { type: Schema.Types.ObjectId, ref: 'JournalEntryTemplate' },
  templateName: String,
  
  isInterCompany: { type: Boolean, default: false },
  sourceCompany: String,
  targetCompany: String,
  matchingEntryId: { type: Schema.Types.ObjectId, ref: 'JournalEntry' },
  
  approvalStatus: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' },
  approvalWorkflow: [{
    level: Number,
    approverId: { type: Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' },
    date: Date,
    comments: String
  }],
  
  budgetCheckPerformed: { type: Boolean, default: false },
  budgetWarnings: [{
    account: { type: Schema.Types.ObjectId, ref: 'Account' },
    budgetAmount: Number,
    actualAmount: Number,
    variance: Number,
    message: String
  }],
  
  attachments: [String],
  
  sourceType: { type: String, enum: ['INVOICE', 'VOUCHER', 'PAYROLL', 'DEPRECIATION', 'ACCRUAL', 'MANUAL'] },
  sourceId: Schema.Types.ObjectId,
  
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  postedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  reversedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  reversalReason: String,
  
  isLocked: { type: Boolean, default: false },
  lockedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  lockedDate: Date,
  
  changeHistory: [{
    changedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    changedAt: Date,
    field: String,
    oldValue: Schema.Types.Mixed,
    newValue: Schema.Types.Mixed
  }]
}, { timestamps: true });

JournalEntrySchema.index({ entryNumber: 1 });
JournalEntrySchema.index({ status: 1, entryDate: 1 });
JournalEntrySchema.index({ periodYear: 1, periodMonth: 1 });
JournalEntrySchema.index({ isRecurring: 1, nextRecurringDate: 1 });

export default mongoose.model<IJournalEntry>('JournalEntry', JournalEntrySchema);
