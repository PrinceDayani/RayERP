import mongoose, { Document, Schema } from 'mongoose';

export interface IJournalLine {
  accountId: mongoose.Types.ObjectId;
  debit: number;
  credit: number;
  description: string;
  costCenter?: string;
  departmentId?: mongoose.Types.ObjectId;
  projectId?: mongoose.Types.ObjectId;
  billReference?: string;
  billAmount?: number;
  billDate?: Date;
}

export interface IJournalEntry extends Document {
  entryNumber: string;
  voucherType: 'journal' | 'payment' | 'receipt' | 'sales' | 'purchase';
  date: Date;
  reference?: string;
  description: string;
  lines: IJournalLine[];
  totalDebit: number;
  totalCredit: number;
  isPosted: boolean;
  currency?: string;
  exchangeRate?: number;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const JournalLineSchema = new Schema<IJournalLine>({
  accountId: {
    type: Schema.Types.ObjectId,
    ref: 'Account',
    required: true
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
  description: {
    type: String,
    required: true,
    trim: true
  },
  costCenter: {
    type: String,
    trim: true
  },
  departmentId: {
    type: Schema.Types.ObjectId,
    ref: 'Department'
  },
  projectId: {
    type: Schema.Types.ObjectId,
    ref: 'Project'
  },
  billReference: {
    type: String,
    trim: true
  },
  billAmount: {
    type: Number,
    min: 0
  },
  billDate: {
    type: Date
  }
});

const JournalEntrySchema = new Schema<IJournalEntry>({
  entryNumber: {
    type: String,
    required: true,
    unique: true
  },
  voucherType: {
    type: String,
    enum: ['journal', 'payment', 'receipt', 'sales', 'purchase'],
    default: 'journal',
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  reference: {
    type: String,
    required: false,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  lines: [JournalLineSchema],
  totalDebit: {
    type: Number,
    default: 0,
    min: 0
  },
  totalCredit: {
    type: Number,
    default: 0,
    min: 0
  },
  isPosted: {
    type: Boolean,
    default: false
  },
  currency: {
    type: String,
    default: 'INR',
    trim: true
  },
  exchangeRate: {
    type: Number,
    default: 1,
    min: 0
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false
  }
}, {
  timestamps: true
});

// Validate that debits equal credits
JournalEntrySchema.pre('save', function(next) {
  const totalDebit = this.lines.reduce((sum, line) => sum + line.debit, 0);
  const totalCredit = this.lines.reduce((sum, line) => sum + line.credit, 0);
  
  this.totalDebit = totalDebit;
  this.totalCredit = totalCredit;
  
  if (Math.abs(totalDebit - totalCredit) > 0.01) {
    return next(new Error('Total debits must equal total credits'));
  }
  
  next();
});

JournalEntrySchema.index({ entryNumber: 1 });
JournalEntrySchema.index({ date: 1 });
JournalEntrySchema.index({ isPosted: 1 });

export const JournalEntry = mongoose.model<IJournalEntry>('JournalEntry', JournalEntrySchema);