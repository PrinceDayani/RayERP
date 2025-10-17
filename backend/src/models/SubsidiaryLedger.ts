import mongoose, { Document, Schema } from 'mongoose';

export interface ISubsidiaryLedger extends Document {
  type: 'vendor' | 'customer' | 'employee';
  entityId: mongoose.Types.ObjectId;
  accountId: mongoose.Types.ObjectId;
  date: Date;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  journalEntryId: mongoose.Types.ObjectId;
  reference: string;
  dueDate?: Date;
  projectId?: mongoose.Types.ObjectId;
  invoiceNumber?: string;
  paymentTerms?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SubsidiaryLedgerSchema = new Schema<ISubsidiaryLedger>({
  type: {
    type: String,
    required: true,
    enum: ['vendor', 'customer', 'employee']
  },
  entityId: {
    type: Schema.Types.ObjectId,
    required: true,
    refPath: 'entityModel'
  },
  accountId: {
    type: Schema.Types.ObjectId,
    ref: 'ChartOfAccounts',
    required: true
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
  dueDate: {
    type: Date
  },
  projectId: {
    type: Schema.Types.ObjectId,
    ref: 'Project'
  },
  invoiceNumber: {
    type: String,
    trim: true
  },
  paymentTerms: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Virtual field for entity model reference
SubsidiaryLedgerSchema.virtual('entityModel').get(function() {
  switch (this.type) {
    case 'vendor': return 'Contact';
    case 'customer': return 'Contact';
    case 'employee': return 'Employee';
    default: return 'Contact';
  }
});

SubsidiaryLedgerSchema.index({ type: 1, entityId: 1, date: 1 });
SubsidiaryLedgerSchema.index({ accountId: 1, date: 1 });
SubsidiaryLedgerSchema.index({ journalEntryId: 1 });

export const SubsidiaryLedger = mongoose.model<ISubsidiaryLedger>('SubsidiaryLedger', SubsidiaryLedgerSchema);