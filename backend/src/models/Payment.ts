import mongoose, { Document, Schema } from 'mongoose';

export interface IPayment extends Document {
  paymentNumber: string;
  projectId: mongoose.Types.ObjectId;
  invoiceId?: mongoose.Types.ObjectId;
  customerId?: mongoose.Types.ObjectId;
  customerName: string;
  amount: number;
  paymentDate: Date;
  paymentMethod: 'cash' | 'check' | 'bank_transfer' | 'credit_card' | 'other';
  reference?: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>({
  paymentNumber: { 
    type: String, 
    required: [true, 'Payment number is required'],
    unique: true,
    trim: true
  },
  projectId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Project', 
    required: [true, 'Project ID is required'],
    index: true
  },
  invoiceId: { type: Schema.Types.ObjectId, ref: 'Invoice', index: true },
  customerId: { type: Schema.Types.ObjectId, ref: 'Contact' },
  customerName: { 
    type: String, 
    required: [true, 'Customer name is required'],
    trim: true,
    maxlength: [100, 'Customer name cannot exceed 100 characters']
  },
  amount: { 
    type: Number, 
    required: [true, 'Payment amount is required'],
    min: [0.01, 'Payment amount must be greater than zero'],
    validate: {
      validator: function(v: number) {
        return !isNaN(v) && isFinite(v);
      },
      message: 'Amount must be a valid number'
    }
  },
  paymentDate: { 
    type: Date, 
    required: [true, 'Payment date is required'],
    validate: {
      validator: function(v: Date) {
        return v <= new Date();
      },
      message: 'Payment date cannot be in the future'
    }
  },
  paymentMethod: { 
    type: String, 
    enum: {
      values: ['cash', 'check', 'bank_transfer', 'credit_card', 'other'],
      message: 'Invalid payment method'
    },
    required: [true, 'Payment method is required']
  },
  reference: { 
    type: String,
    trim: true,
    maxlength: [100, 'Reference cannot exceed 100 characters']
  },
  status: { 
    type: String, 
    enum: {
      values: ['pending', 'completed', 'failed', 'cancelled'],
      message: 'Invalid payment status'
    },
    default: 'pending',
    index: true
  },
  notes: { 
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters']
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
paymentSchema.index({ projectId: 1, status: 1 });
paymentSchema.index({ paymentDate: -1, projectId: 1 });
paymentSchema.index({ invoiceId: 1 });
paymentSchema.index({ paymentNumber: 1 }, { unique: true });

// Pre-save middleware
paymentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Auto-generate payment number if not provided
  if (!this.paymentNumber) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    this.paymentNumber = `PAY-${year}${month}-${random}`;
  }
  
  next();
});

// Prevent modification of completed payments
paymentSchema.pre('save', function(next) {
  if (this.isModified() && this.status === 'completed' && !this.isNew) {
    const modifiedPaths = this.modifiedPaths();
    const allowedModifications = ['updatedAt', 'notes'];
    const hasUnallowedModifications = modifiedPaths.some(path => !allowedModifications.includes(path));
    
    if (hasUnallowedModifications) {
      return next(new Error('Cannot modify completed payments'));
    }
  }
  next();
});

// Virtual for formatted amount
paymentSchema.virtual('formattedAmount').get(function() {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(this.amount);
});

export default mongoose.model<IPayment>('Payment', paymentSchema);