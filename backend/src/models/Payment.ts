import mongoose, { Document, Schema } from 'mongoose';

export interface IPayment extends Document {
  paymentNumber: string;
  projectId?: mongoose.Types.ObjectId;
  invoiceIds: mongoose.Types.ObjectId[];
  customerId?: mongoose.Types.ObjectId;
  customerName: string;
  totalAmount: number;
  currency: string;
  exchangeRate: number;
  baseAmount: number;
  paymentDate: Date;
  paymentMethod: 'CASH' | 'CHEQUE' | 'BANK_TRANSFER' | 'UPI' | 'CARD' | 'NEFT' | 'RTGS' | 'WALLET';
  bankAccount?: string;
  reference?: string;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'REFUNDED' | 'DISPUTED';
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  allocations: Array<{
    invoiceId: mongoose.Types.ObjectId;
    amount: number;
    accountId?: mongoose.Types.ObjectId;
  }>;
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
  projectId: { type: Schema.Types.ObjectId, ref: 'Project' },
  invoiceIds: [{ type: Schema.Types.ObjectId, ref: 'Invoice' }],
  customerId: { type: Schema.Types.ObjectId, ref: 'Contact' },
  customerName: { type: String, required: true },
  totalAmount: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'INR' },
  exchangeRate: { type: Number, default: 1 },
  baseAmount: { type: Number, required: true },
  paymentDate: { type: Date, required: true },
  paymentMethod: { type: String, enum: ['CASH', 'CHEQUE', 'BANK_TRANSFER', 'UPI', 'CARD', 'NEFT', 'RTGS', 'WALLET'], required: true },
  bankAccount: String,
  reference: String,
  status: { type: String, enum: ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED', 'DISPUTED'], default: 'DRAFT' },
  approvalStatus: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' },
  approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  approvedAt: Date,
  allocations: [{
    invoiceId: { type: Schema.Types.ObjectId, ref: 'Invoice' },
    amount: Number,
    accountId: { type: Schema.Types.ObjectId, ref: 'Account' }
  }],
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
paymentSchema.index({ status: 1, paymentDate: -1 });
paymentSchema.index({ customerId: 1 });
paymentSchema.index({ 'reconciliation.status': 1 });

paymentSchema.pre('save', function(next) {
  if (!this.paymentNumber) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.paymentNumber = `PAY-${year}${month}-${random}`;
  }
  if (!this.baseAmount) this.baseAmount = this.totalAmount * this.exchangeRate;
  next();
});

export default mongoose.model<IPayment>('Payment', paymentSchema);