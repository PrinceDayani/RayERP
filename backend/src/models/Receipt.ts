import mongoose, { Schema, Document } from 'mongoose';

export interface IReceipt extends Document {
  receiptNumber: string;
  receiptDate: Date;
  
  // Payment Details
  amount: number;
  currency: string;
  exchangeRate: number;
  amountInBaseCurrency: number;
  paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'CHEQUE' | 'UPI' | 'OTHER';
  paymentReference?: string;
  transactionId?: string;
  
  // Related Documents
  invoiceId: mongoose.Types.ObjectId;
  invoiceNumber: string;
  customerId?: mongoose.Types.ObjectId;
  
  // Party Details
  receivedFrom: string;
  receivedFromEmail?: string;
  receivedFromAddress?: string;
  
  // Bank Details (if applicable)
  bankName?: string;
  accountNumber?: string;
  chequeNumber?: string;
  chequeDate?: Date;
  
  // Accounting
  journalEntryId?: mongoose.Types.ObjectId;
  
  // Notes
  notes?: string;
  internalNotes?: string;
  
  // Status
  status: 'VALID' | 'CANCELLED' | 'REFUNDED';
  cancellationReason?: string;
  cancellationDate?: Date;
  
  // Audit
  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  cancelledBy?: mongoose.Types.ObjectId;
}

const ReceiptSchema = new Schema<IReceipt>({
  receiptNumber: { type: String, required: true, unique: true },
  receiptDate: { type: Date, required: true, default: Date.now },
  
  amount: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'INR' },
  exchangeRate: { type: Number, default: 1 },
  amountInBaseCurrency: { type: Number, required: true },
  paymentMethod: { 
    type: String, 
    enum: ['CASH', 'BANK_TRANSFER', 'CREDIT_CARD', 'DEBIT_CARD', 'CHEQUE', 'UPI', 'OTHER'],
    required: true 
  },
  paymentReference: String,
  transactionId: String,
  
  invoiceId: { type: Schema.Types.ObjectId, ref: 'Invoice', required: true },
  invoiceNumber: { type: String, required: true },
  customerId: { type: Schema.Types.ObjectId, ref: 'Contact' },
  
  receivedFrom: { type: String, required: true },
  receivedFromEmail: String,
  receivedFromAddress: String,
  
  bankName: String,
  accountNumber: String,
  chequeNumber: String,
  chequeDate: Date,
  
  journalEntryId: { type: Schema.Types.ObjectId, ref: 'JournalEntry' },
  
  notes: String,
  internalNotes: String,
  
  status: { type: String, enum: ['VALID', 'CANCELLED', 'REFUNDED'], default: 'VALID' },
  cancellationReason: String,
  cancellationDate: Date,
  
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  cancelledBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Indexes
ReceiptSchema.index({ receiptNumber: 1 }, { unique: true });
ReceiptSchema.index({ invoiceId: 1, receiptDate: -1 });
ReceiptSchema.index({ customerId: 1, receiptDate: -1 });
ReceiptSchema.index({ receiptDate: -1, status: 1 });
ReceiptSchema.index({ createdBy: 1, receiptDate: -1 });
ReceiptSchema.index({ status: 1, receiptDate: -1 });

// Validation
ReceiptSchema.pre('save', function(next) {
  if (this.amount <= 0) {
    return next(new Error('Receipt amount must be greater than 0'));
  }
  if (this.paymentMethod === 'CHEQUE' && !this.chequeNumber) {
    return next(new Error('Cheque number is required for cheque payments'));
  }
  next();
});

export default mongoose.model<IReceipt>('Receipt', ReceiptSchema);
