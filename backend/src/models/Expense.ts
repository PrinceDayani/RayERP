import mongoose, { Document, Schema } from 'mongoose';

const EXPENSE_CATEGORIES = [
  'Travel', 'Meals', 'Office Supplies', 'Equipment', 'Software', 
  'Marketing', 'Training', 'Utilities', 'Rent', 'Other'
];

export interface IExpense extends Document {
  expenseNumber: string;
  projectId: mongoose.Types.ObjectId;
  employeeId?: mongoose.Types.ObjectId;
  employeeName: string;
  category: string;
  description: string;
  amount: number;
  expenseDate: Date;
  receiptUrl?: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'paid';
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  rejectionReason?: string;
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const expenseSchema = new Schema<IExpense>({
  expenseNumber: { 
    type: String, 
    required: [true, 'Expense number is required'],
    unique: true,
    trim: true
  },
  projectId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Project', 
    required: [true, 'Project ID is required'],
    index: true
  },
  employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', index: true },
  employeeName: { 
    type: String, 
    required: [true, 'Employee name is required'],
    trim: true,
    maxlength: [100, 'Employee name cannot exceed 100 characters']
  },
  category: { 
    type: String, 
    required: [true, 'Category is required'],
    enum: {
      values: EXPENSE_CATEGORIES,
      message: 'Invalid expense category'
    },
    index: true
  },
  description: { 
    type: String, 
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  amount: { 
    type: Number, 
    required: [true, 'Amount is required'],
    min: [0.01, 'Amount must be greater than zero'],
    validate: {
      validator: function(v: number) {
        return !isNaN(v) && isFinite(v);
      },
      message: 'Amount must be a valid number'
    }
  },
  expenseDate: { 
    type: Date, 
    required: [true, 'Expense date is required'],
    validate: {
      validator: function(v: Date) {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        return v >= sixMonthsAgo && v <= new Date();
      },
      message: 'Expense date must be within the last 6 months and not in the future'
    }
  },
  receiptUrl: { 
    type: String,
    validate: {
      validator: function(v: string) {
        return !v || /^https?:\/\/.+/.test(v);
      },
      message: 'Receipt URL must be a valid HTTP/HTTPS URL'
    }
  },
  status: { 
    type: String, 
    enum: {
      values: ['draft', 'submitted', 'approved', 'rejected', 'paid'],
      message: 'Invalid expense status'
    },
    default: 'draft',
    index: true
  },
  approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  approvedAt: Date,
  rejectionReason: { 
    type: String,
    maxlength: [500, 'Rejection reason cannot exceed 500 characters']
  },
  notes: { 
    type: String,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
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
expenseSchema.index({ projectId: 1, status: 1 });
expenseSchema.index({ employeeId: 1, status: 1 });
expenseSchema.index({ category: 1, projectId: 1 });
expenseSchema.index({ expenseDate: -1, projectId: 1 });
expenseSchema.index({ expenseNumber: 1 }, { unique: true });

// Pre-save middleware
expenseSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Auto-generate expense number if not provided
  if (!this.expenseNumber) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    this.expenseNumber = `EXP-${year}${month}-${random}`;
  }
  
  // Set approval timestamp when status changes to approved
  if (this.isModified('status') && this.status === 'approved' && !this.approvedAt) {
    this.approvedAt = new Date();
  }
  
  // Clear rejection reason when approved
  if (this.status === 'approved') {
    this.rejectionReason = undefined;
  }
  
  // Require rejection reason when rejected
  if (this.status === 'rejected' && !this.rejectionReason) {
    return next(new Error('Rejection reason is required when rejecting an expense'));
  }
  
  next();
});

// Prevent modification of paid expenses
expenseSchema.pre('save', function(next) {
  if (this.isModified() && this.status === 'paid' && !this.isNew) {
    const modifiedPaths = this.modifiedPaths();
    const allowedModifications = ['updatedAt', 'notes'];
    const hasUnallowedModifications = modifiedPaths.some(path => !allowedModifications.includes(path));
    
    if (hasUnallowedModifications) {
      return next(new Error('Cannot modify paid expenses'));
    }
  }
  next();
});

// Virtual for formatted amount
expenseSchema.virtual('formattedAmount').get(function() {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(this.amount);
});

// Virtual for days since submission
expenseSchema.virtual('daysSinceSubmission').get(function() {
  if (this.status === 'submitted') {
    const diffTime = Math.abs(new Date().getTime() - this.createdAt.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  return null;
});

export { EXPENSE_CATEGORIES };
export default mongoose.model<IExpense>('Expense', expenseSchema);