import mongoose, { Document, Schema } from 'mongoose';

export interface ITransactionEntry {
  accountId: mongoose.Types.ObjectId;
  accountName: string;
  debit: number;
  credit: number;
}

export interface ITransaction extends Document {
  transactionNumber: string;
  projectId: mongoose.Types.ObjectId;
  date: Date;
  description: string;
  reference?: string;
  entries: ITransactionEntry[];
  totalAmount: number;
  status: 'draft' | 'posted' | 'reversed';
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

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
    min: [0, 'Debit amount cannot be negative'],
    validate: {
      validator: function(v: number) {
        return !isNaN(v) && isFinite(v);
      },
      message: 'Debit must be a valid number'
    }
  },
  credit: { 
    type: Number, 
    default: 0,
    min: [0, 'Credit amount cannot be negative'],
    validate: {
      validator: function(v: number) {
        return !isNaN(v) && isFinite(v);
      },
      message: 'Credit must be a valid number'
    }
  }
});

// Validate that debit and credit are not both zero
transactionEntrySchema.pre('validate', function(next) {
  if (this.debit === 0 && this.credit === 0) {
    next(new Error('Either debit or credit must be greater than zero'));
  } else {
    next();
  }
});

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
      validator: function(v: Date) {
        return v <= new Date();
      },
      message: 'Transaction date cannot be in the future'
    }
  },
  description: { 
    type: String, 
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
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
        return Math.abs(totalDebits - totalCredits) < 0.01;
      },
      message: 'Transaction must have at least 2 entries and debits must equal credits'
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
      values: ['draft', 'posted', 'reversed'],
      message: 'Invalid transaction status'
    },
    default: 'draft',
    index: true
  },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
transactionSchema.index({ projectId: 1, date: -1 });
transactionSchema.index({ status: 1, projectId: 1 });
transactionSchema.index({ transactionNumber: 1 }, { unique: true });

// Pre-save middleware
transactionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Auto-generate transaction number if not provided
  if (!this.transactionNumber) {
    this.transactionNumber = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
  }
  
  // Calculate total amount from entries
  if (this.entries && this.entries.length > 0) {
    this.totalAmount = this.entries.reduce((sum, entry) => sum + Math.max(entry.debit, entry.credit), 0);
  }
  
  next();
});

// Prevent modification of posted transactions
transactionSchema.pre('save', function(next) {
  if (this.isModified() && this.status === 'posted' && !this.isNew) {
    const modifiedPaths = this.modifiedPaths();
    const allowedModifications = ['updatedAt'];
    const hasUnallowedModifications = modifiedPaths.some(path => !allowedModifications.includes(path));
    
    if (hasUnallowedModifications) {
      return next(new Error('Cannot modify posted transactions'));
    }
  }
  next();
});

export default mongoose.model<ITransaction>('Transaction', transactionSchema);