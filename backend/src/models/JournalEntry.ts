import mongoose, { Document, Schema } from 'mongoose';

export interface IJournalLine {
  accountId: mongoose.Types.ObjectId;
  debit: number;
  credit: number;
  description: string;
}

export interface IJournalEntry extends Document {
  entryNumber: string;
  date: Date;
  reference?: string;
  description: string;
  lines: IJournalLine[];
  totalDebit: number;
  totalCredit: number;
  isPosted: boolean;
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
  }
});

const JournalEntrySchema = new Schema<IJournalEntry>({
  entryNumber: {
    type: String,
    required: true,
    unique: true
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