import mongoose, { Document, Schema } from 'mongoose';

export interface ITransaction extends Document {
  transactionType: 'invoice' | 'bill' | 'payment' | 'receipt' | 'adjustment' | 'opening_balance';
  transactionId: string;
  journalEntryId: mongoose.Types.ObjectId;
  amount: number;
  status: 'draft' | 'posted' | 'cancelled';
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>({
  transactionType: {
    type: String,
    required: true,
    enum: ['invoice', 'bill', 'payment', 'receipt', 'adjustment', 'opening_balance'],
    index: true
  },
  transactionId: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  journalEntryId: {
    type: Schema.Types.ObjectId,
    ref: 'JournalEntry',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: ['draft', 'posted', 'cancelled'],
    default: 'draft'
  },
  metadata: {
    type: Schema.Types.Mixed
  }
}, {
  timestamps: true
});

TransactionSchema.index({ transactionType: 1, status: 1 });
TransactionSchema.index({ transactionId: 1, transactionType: 1 });

export const Transaction = mongoose.model<ITransaction>('Transaction', TransactionSchema);