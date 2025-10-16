import mongoose, { Document, Schema } from 'mongoose';

export interface IInvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  taxRate?: number;
  taxAmount?: number;
}

export interface IInvoice extends Document {
  invoiceNumber: string;
  projectId: mongoose.Types.ObjectId;
  customerId?: mongoose.Types.ObjectId;
  customerName: string;
  customerEmail?: string;
  issueDate: Date;
  dueDate: Date;
  items: IInvoiceItem[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const invoiceItemSchema = new Schema<IInvoiceItem>({
  description: { 
    type: String, 
    required: [true, 'Item description is required'],
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  quantity: { 
    type: Number, 
    required: [true, 'Quantity is required'],
    min: [0.01, 'Quantity must be greater than zero']
  },
  unitPrice: { 
    type: Number, 
    required: [true, 'Unit price is required'],
    min: [0, 'Unit price cannot be negative']
  },
  totalPrice: { 
    type: Number, 
    required: [true, 'Total price is required'],
    min: [0, 'Total price cannot be negative']
  },
  taxRate: { 
    type: Number, 
    default: 0,
    min: [0, 'Tax rate cannot be negative'],
    max: [100, 'Tax rate cannot exceed 100%']
  },
  taxAmount: { 
    type: Number, 
    default: 0,
    min: [0, 'Tax amount cannot be negative']
  }
});

// Validate item calculations
invoiceItemSchema.pre('validate', function(next) {
  const expectedTotal = this.quantity * this.unitPrice;
  const expectedTax = expectedTotal * (this.taxRate || 0) / 100;
  
  if (Math.abs(this.totalPrice - expectedTotal) > 0.01) {
    next(new Error('Total price must equal quantity × unit price'));
  } else if (Math.abs(this.taxAmount - expectedTax) > 0.01) {
    next(new Error('Tax amount calculation is incorrect'));
  } else {
    next();
  }
});

const invoiceSchema = new Schema<IInvoice>({
  invoiceNumber: { 
    type: String, 
    required: [true, 'Invoice number is required'],
    unique: true,
    trim: true
  },
  projectId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Project', 
    required: [true, 'Project ID is required'],
    index: true
  },
  customerId: { type: Schema.Types.ObjectId, ref: 'Contact' },
  customerName: { 
    type: String, 
    required: [true, 'Customer name is required'],
    trim: true,
    maxlength: [100, 'Customer name cannot exceed 100 characters']
  },
  customerEmail: { 
    type: String,
    trim: true,
    lowercase: true,
    validate: {
      validator: function(v: string) {
        return !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Invalid email format'
    }
  },
  issueDate: { 
    type: Date, 
    required: [true, 'Issue date is required'],
    default: Date.now
  },
  dueDate: { 
    type: Date, 
    required: [true, 'Due date is required'],
    validate: {
      validator: function(v: Date) {
        return v >= this.issueDate;
      },
      message: 'Due date must be after issue date'
    }
  },
  items: {
    type: [invoiceItemSchema],
    validate: {
      validator: function(items: IInvoiceItem[]) {
        return items && items.length > 0;
      },
      message: 'Invoice must have at least one item'
    }
  },
  subtotal: { 
    type: Number, 
    required: [true, 'Subtotal is required'],
    min: [0, 'Subtotal cannot be negative']
  },
  taxAmount: { 
    type: Number, 
    default: 0,
    min: [0, 'Tax amount cannot be negative']
  },
  totalAmount: { 
    type: Number, 
    required: [true, 'Total amount is required'],
    min: [0.01, 'Total amount must be greater than zero']
  },
  paidAmount: { 
    type: Number, 
    default: 0,
    min: [0, 'Paid amount cannot be negative'],
    validate: {
      validator: function(v: number) {
        return v <= this.totalAmount;
      },
      message: 'Paid amount cannot exceed total amount'
    }
  },
  status: { 
    type: String, 
    enum: {
      values: ['draft', 'sent', 'paid', 'overdue', 'cancelled'],
      message: 'Invalid invoice status'
    },
    default: 'draft',
    index: true
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
invoiceSchema.index({ projectId: 1, status: 1 });
invoiceSchema.index({ dueDate: 1, status: 1 });
invoiceSchema.index({ customerName: 1, projectId: 1 });
invoiceSchema.index({ invoiceNumber: 1 }, { unique: true });

// Pre-save middleware
invoiceSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Auto-generate invoice number if not provided
  if (!this.invoiceNumber) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    this.invoiceNumber = `INV-${year}${month}-${random}`;
  }
  
  // Auto-calculate totals from items
  if (this.items && this.items.length > 0) {
    this.subtotal = this.items.reduce((sum, item) => sum + item.totalPrice, 0);
    this.taxAmount = this.items.reduce((sum, item) => sum + (item.taxAmount || 0), 0);
    this.totalAmount = this.subtotal + this.taxAmount;
  }
  
  // Auto-update status based on payment
  if (this.paidAmount >= this.totalAmount && this.status !== 'cancelled') {
    this.status = 'paid';
  } else if (this.dueDate < new Date() && this.status === 'sent') {
    this.status = 'overdue';
  }
  
  next();
});

// Virtual for remaining balance
invoiceSchema.virtual('remainingBalance').get(function() {
  return this.totalAmount - this.paidAmount;
});

// Virtual for payment percentage
invoiceSchema.virtual('paymentPercentage').get(function() {
  return this.totalAmount > 0 ? (this.paidAmount / this.totalAmount) * 100 : 0;
});

export default mongoose.model<IInvoice>('Invoice', invoiceSchema);