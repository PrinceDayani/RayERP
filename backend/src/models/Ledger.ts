import mongoose, { Document, Schema } from 'mongoose';

export interface ILedger extends Document {
  accountId: mongoose.Types.ObjectId;
  date: Date;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  journalEntryId: mongoose.Types.ObjectId;
  reference: string;
  taxInfo?: {
    gstNo?: string;
    panNo?: string;
    aadharNo?: string;
    tanNo?: string;
    cinNo?: string;
  };
  contactInfo?: {
    primaryEmail?: string;
    secondaryEmail?: string;
    primaryPhone?: string;
    secondaryPhone?: string;
    mobile?: string;
  };
  createdAt: Date;
}

const LedgerSchema = new Schema<ILedger>({
  accountId: {
    type: Schema.Types.ObjectId,
    ref: 'Account',
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
  taxInfo: {
    gstNo: String,
    panNo: String,
    aadharNo: String,
    tanNo: String,
    cinNo: String
  },
  contactInfo: {
    primaryEmail: String,
    secondaryEmail: String,
    primaryPhone: String,
    secondaryPhone: String,
    mobile: String
  }
}, {
  timestamps: true
});

LedgerSchema.index({ accountId: 1, date: 1 });
LedgerSchema.index({ journalEntryId: 1 });

export const Ledger = mongoose.model<ILedger>('Ledger', LedgerSchema);