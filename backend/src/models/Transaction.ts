import mongoose, { Document, Schema } from 'mongoose';

/**
 * @interface ITransactionEntry
 * @description Represents a single entry (debit or credit) within a double-entry transaction.
 */
export interface ITransactionEntry {
  accountId: mongoose.Types.ObjectId;
  accountName: string;
  debit: number;
  credit: number;
}

/**
 * @interface ITransaction
 * @description Represents a complete financial transaction document.
 */
export interface ITransaction extends Document {
  transactionNumber: string;
  projectId: mongoose.Types.ObjectId;
  date: Date;
  description: string;
  transactionType: 'invoice' | 'bill' | 'payment' | 'receipt' | 'adjustment' | 'opening_balance' | 'journal';
  reference?: string;
  entries: ITransactionEntry[];
  totalAmount: number;
  status: 'draft' | 'posted' | 'reversed' | 'cancelled';
  createdBy: mongoose.Types.ObjectId;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// Sub-schema for individual transaction entries (debits/credits)
const transactionEntrySchema = new Schema<ITransactionEntry>({
  accountId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Account', 
    required: [true, 'Account ID is required'] 
  },
  accountName: { 
    type: String, 
    required: [true, 'Account name is required'],
    trim: true
  },
  debit: { 
    type: Number, 
    default: 0,
    min: [0, 'Debit amount cannot be negative']
  },
  credit: { 
    type: Number, 
    default: 0,
    min: [0, 'Credit amount cannot be negative']
  }
}, { _id: false }); // Disable _id for subdocuments

// Pre-validation middleware for entries
transactionEntrySchema.pre('validate', function(next) {
  if (this.debit === 0 && this.credit === 0) {
    return next(new Error('Either debit or credit must be have a value.'));
  }
  if (this.debit > 0 && this.credit > 0) {
    return next(new Error('An entry can have either a debit or a credit, but not both.'));
  }
  next();
});


// Main schema for the transaction
const transactionSchema = new Schema<ITransaction>({
  transactionNumber: { 
    type: String, 
    required: [true, 'Transaction number is required'],
    unique: true,
    trim: true
  },
  projectId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Project', 
    required: [true, 'Project ID is required'],
    index: true
  },
  date: { 
    type: Date, 
    required: [true, 'Transaction date is required'],
    validate: {
      validator: (v: Date) => v <= new Date(),
      message: 'Transaction date cannot be in the future'
    }
  },
  description: { 
    type: String, 
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  transactionType: {
    type: String,
    required: true,
    enum: ['invoice', 'bill', 'payment', 'receipt', 'adjustment', 'opening_balance', 'journal'],
    index: true
  },
  reference: { 
    type: String, 
    trim: true,
    maxlength: [100, 'Reference cannot exceed 100 characters']
  },
  entries: {
    type: [transactionEntrySchema],
    validate: {
      validator: function(entries: ITransactionEntry[]) {
        if (entries.length < 2) return false;
        const totalDebits = entries.reduce((sum, entry) => sum + entry.debit, 0);
        const totalCredits = entries.reduce((sum, entry) => sum + entry.credit, 0);
        // Use a small epsilon for floating point comparison
        return Math.abs(totalDebits - totalCredits) < 0.01; 
      },
      message: 'Transaction must have at least 2 entries and total debits must equal total credits.'
    }
  },
  totalAmount: { 
    type: Number, 
    required: [true, 'Total amount is required'],
    min: [0.01, 'Total amount must be greater than zero']
  },
  status: { 
    type: String, 
    enum: {
      values: ['draft', 'posted', 'reversed', 'cancelled'],
      message: 'Invalid transaction status: {VALUE}'
    },
    default: 'draft',
    index: true
  },
  createdBy: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  metadata: {
    type: Schema.Types.Mixed
  }
}, {
  timestamps: true, // Manages createdAt and updatedAt fields
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// --- INDEXES ---
transactionSchema.index({ projectId: 1, date: -1 });
transactionSchema.index({ status: 1, projectId: 1 });

// --- MIDDLEWARE ---

// Pre-save middleware to perform calculations and validations
transactionSchema.pre('save', function(next) {
  // Auto-generate transaction number if not provided
  if (!this.isNew || !this.transactionNumber) {
    this.transactionNumber = `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  }
  
  // Calculate total amount from the debit side of the entries
  if (this.isModified('entries') && this.entries && this.entries.length > 0) {
    this.totalAmount = this.entries.reduce((sum, entry) => sum + entry.debit, 0);
  }
  
  next();
});

// Pre-save middleware to prevent modification of posted transactions
transactionSchema.pre('save', function(next) {
  if (this.isModified() && this.get('status', { getters: false }) === 'posted') {
    return next(new Error('Posted transactions cannot be modified. Please reverse it instead.'));
  }
  next();
});

export const Transaction = mongoose.model<ITransaction>('Transaction', transactionSchema);