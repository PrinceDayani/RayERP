import mongoose, { Document, Schema } from 'mongoose';

export interface IPaymentAllocation {
  invoiceId: mongoose.Types.ObjectId;
  invoiceNumber: string;
  amount: number;
  allocationDate: Date;
  accountId?: mongoose.Types.ObjectId;
}

export interface IReferenceAllocation {
  journalEntryId: mongoose.Types.ObjectId;
  entryNumber: string;
  reference: string;
  amount: number;
  allocationDate: Date;
  description?: string;
}

export interface IPayment extends Document {
  paymentNumber: string;
  paymentType: 'invoice-based' | 'independent' | 'advance';
  customerId: mongoose.Types.ObjectId;
  customerName: string;
  totalAmount: number;
  allocatedAmount: number;
  unappliedAmount: number;
  currency: string;
  exchangeRate: number;
  baseAmount: number;
  paymentDate: Date;
  paymentMethod: 'CASH' | 'CHEQUE' | 'BANK_TRANSFER' | 'UPI' | 'CARD' | 'NEFT' | 'RTGS' | 'WALLET';
  bankAccount?: string;
  reference?: string;
  allocations: IPaymentAllocation[];
  referenceAllocations: IReferenceAllocation[];
  purpose?: string;
  category?: 'advance' | 'deposit' | 'miscellaneous' | 'refund';
  projectId?: mongoose.Types.ObjectId;
  invoiceIds: mongoose.Types.ObjectId[];
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'REFUNDED' | 'DISPUTED';
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  schedules?: Array<{
    dueDate: Date;
    amount: number;
    status: 'PENDING' | 'PAID' | 'OVERDUE';
    paidDate?: Date;
  }>;
  refund?: {
    amount: number;
    reason: string;
    refundDate: Date;
    refundedBy: mongoose.Types.ObjectId;
  };
  dispute?: {
    reason: string;
    status: 'OPEN' | 'RESOLVED' | 'CLOSED';
    raisedDate: Date;
    resolvedDate?: Date;
  };
  reconciliation?: {
    bankStatementId?: mongoose.Types.ObjectId;
    reconciledDate?: Date;
    reconciledBy?: mongoose.Types.ObjectId;
    status: 'UNRECONCILED' | 'RECONCILED' | 'PENDING';
  };
  journalEntryId?: mongoose.Types.ObjectId;
  receiptGenerated: boolean;
  receiptUrl?: string;
  remindersSent: number;
  lastReminderDate?: Date;
  notes?: string;
  attachments?: string[];
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>({
  paymentNumber: { type: String, required: true, unique: true },
  paymentType: { type: String, enum: ['invoice-based', 'independent', 'advance'], default: 'invoice-based', required: true },
  customerId: { type: Schema.Types.ObjectId, ref: 'Contact', required: true },
  customerName: { type: String, required: true },
  totalAmount: { type: Number, required: true, min: 0 },
  allocatedAmount: { type: Number, default: 0, min: 0 },
  unappliedAmount: { type: Number, default: 0, min: 0 },
  currency: { type: String, default: 'INR' },
  exchangeRate: { type: Number, default: 1 },
  baseAmount: { type: Number, required: true },
  paymentDate: { type: Date, required: true },
  paymentMethod: { type: String, enum: ['CASH', 'CHEQUE', 'BANK_TRANSFER', 'UPI', 'CARD', 'NEFT', 'RTGS', 'WALLET'], required: true },
  bankAccount: String,
  reference: String,
  allocations: [{
    invoiceId: { type: Schema.Types.ObjectId, ref: 'Invoice', required: true },
    invoiceNumber: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    allocationDate: { type: Date, default: Date.now },
    accountId: { type: Schema.Types.ObjectId, ref: 'ChartOfAccount' }
  }],
  referenceAllocations: [{
    journalEntryId: { type: Schema.Types.ObjectId, ref: 'JournalEntry', required: true },
    entryNumber: { type: String, required: true },
    reference: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    allocationDate: { type: Date, default: Date.now },
    description: String
  }],
  purpose: String,
  category: { type: String, enum: ['advance', 'deposit', 'miscellaneous', 'refund'] },
  projectId: { type: Schema.Types.ObjectId, ref: 'Project' },
  invoiceIds: [{ type: Schema.Types.ObjectId, ref: 'Invoice' }],
  status: { type: String, enum: ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED', 'DISPUTED'], default: 'DRAFT' },
  approvalStatus: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' },
  approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  approvedAt: Date,
  schedules: [{
    dueDate: Date,
    amount: Number,
    status: { type: String, enum: ['PENDING', 'PAID', 'OVERDUE'], default: 'PENDING' },
    paidDate: Date
  }],
  refund: {
    amount: Number,
    reason: String,
    refundDate: Date,
    refundedBy: { type: Schema.Types.ObjectId, ref: 'User' }
  },
  dispute: {
    reason: String,
    status: { type: String, enum: ['OPEN', 'RESOLVED', 'CLOSED'] },
    raisedDate: Date,
    resolvedDate: Date
  },
  reconciliation: {
    bankStatementId: { type: Schema.Types.ObjectId, ref: 'BankStatement' },
    reconciledDate: Date,
    reconciledBy: { type: Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['UNRECONCILED', 'RECONCILED', 'PENDING'], default: 'UNRECONCILED' }
  },
  journalEntryId: { type: Schema.Types.ObjectId, ref: 'JournalEntry' },
  receiptGenerated: { type: Boolean, default: false },
  receiptUrl: String,
  remindersSent: { type: Number, default: 0 },
  lastReminderDate: Date,
  notes: String,
  attachments: [String],
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

paymentSchema.index({ paymentNumber: 1 });
paymentSchema.index({ paymentType: 1, status: 1 });
paymentSchema.index({ customerId: 1, paymentDate: -1 });
paymentSchema.index({ status: 1, paymentDate: -1 });
paymentSchema.index({ 'allocations.invoiceId': 1 });
paymentSchema.index({ 'referenceAllocations.journalEntryId': 1 });
paymentSchema.index({ 'reconciliation.status': 1 });
paymentSchema.index({ unappliedAmount: 1 }, { partialFilterExpression: { unappliedAmount: { $gt: 0 } } });

paymentSchema.pre('save', function(next) {
  if (!this.paymentNumber) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.paymentNumber = `PAY-${year}${month}-${random}`;
  }
  if (!this.baseAmount) this.baseAmount = this.totalAmount * this.exchangeRate;
  const invoiceAllocated = this.allocations?.reduce((sum, alloc) => sum + alloc.amount, 0) || 0;
  const refAllocated = this.referenceAllocations?.reduce((sum, alloc) => sum + alloc.amount, 0) || 0;
  this.allocatedAmount = invoiceAllocated + refAllocated;
  this.unappliedAmount = this.totalAmount - this.allocatedAmount;
  if (this.allocatedAmount > this.totalAmount) {
    return next(new Error('Allocated amount cannot exceed total payment amount'));
  }
  if (this.paymentType === 'independent' && !this.category) {
    this.category = 'miscellaneous';
  }
  next();
});

paymentSchema.statics.findUnallocated = function(customerId?: string, limit = 50) {
  const filter: any = { unappliedAmount: { $gt: 0 }, status: { $in: ['APPROVED', 'COMPLETED'] } };
  if (customerId) filter.customerId = customerId;
  return this.find(filter).sort({ paymentDate: -1 }).limit(limit).lean();
};

paymentSchema.statics.getCustomerBalance = async function(customerId: string) {
  const result = await this.aggregate([
    { $match: { customerId: new mongoose.Types.ObjectId(customerId), status: { $in: ['APPROVED', 'COMPLETED'] } } },
    { $group: { _id: null, totalPaid: { $sum: '$totalAmount' }, totalAllocated: { $sum: '$allocatedAmount' }, totalUnapplied: { $sum: '$unappliedAmount' } } }
  ]);
  return result[0] || { totalPaid: 0, totalAllocated: 0, totalUnapplied: 0 };
};

paymentSchema.methods.canAllocate = function(amount: number): boolean {
  return this.unappliedAmount >= amount;
};

paymentSchema.methods.addAllocation = async function(invoiceId: mongoose.Types.ObjectId, invoiceNumber: string, amount: number) {
  if (!this.canAllocate(amount)) throw new Error('Insufficient unapplied balance');
  this.allocations.push({ invoiceId, invoiceNumber, amount, allocationDate: new Date() });
  await this.save();
  return this;
};

paymentSchema.methods.addReferenceAllocation = async function(journalEntryId: mongoose.Types.ObjectId, entryNumber: string, reference: string, amount: number, description?: string) {
  if (!this.canAllocate(amount)) throw new Error('Insufficient unapplied balance');
  if (!this.referenceAllocations) this.referenceAllocations = [];
  this.referenceAllocations.push({ journalEntryId, entryNumber, reference, amount, allocationDate: new Date(), description });
  await this.save();
  return this;
};

export default mongoose.model<IPayment>('Payment', paymentSchema);
