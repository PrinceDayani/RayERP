import mongoose, { Schema, Document } from 'mongoose';

export interface IInvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  taxAmount: number;
  discount: number;
  amount: number;
  account?: mongoose.Types.ObjectId;
  costCenter?: mongoose.Types.ObjectId;
}

export interface IPaymentRecord {
  date: Date;
  amount: number;
  currency: string;
  exchangeRate: number;
  amountInBaseCurrency: number;
  paymentMethod: string;
  reference: string;
  voucherId?: mongoose.Types.ObjectId;
  notes?: string;
}

export interface IInvoice extends Document {
  invoiceNumber: string;
  workOrderNumber?: string;
  invoiceType: 'SALES' | 'PURCHASE' | 'CREDIT_NOTE' | 'DEBIT_NOTE';
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'SENT' | 'VIEWED' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'CANCELLED' | 'FACTORED';
  
  // Party Details
  customerId?: mongoose.Types.ObjectId;
  vendorId?: mongoose.Types.ObjectId;
  partyName: string;
  partyEmail?: string;
  partyAddress?: string;
  partyGSTIN?: string;
  
  // GST Details
  gstEnabled: boolean;
  gstRate?: number;
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  gstTotalAmount?: number;
  
  // Dates
  invoiceDate: Date;
  dueDate: Date;
  sentDate?: Date;
  viewedDate?: Date;
  paidDate?: Date;
  
  // Currency
  currency: string;
  exchangeRate: number;
  baseCurrency: string;
  
  // Line Items
  lineItems: IInvoiceLineItem[];
  
  // Amounts
  subtotal: number;
  totalTax: number;
  totalDiscount: number;
  totalAmount: number;
  amountInBaseCurrency: number;
  
  // Payment
  paymentTerms: 'NET_15' | 'NET_30' | 'NET_60' | 'NET_90' | 'DUE_ON_RECEIPT' | 'CUSTOM';
  customPaymentTerms?: string;
  earlyPaymentDiscount?: number;
  earlyPaymentDays?: number;
  paidAmount: number;
  balanceAmount: number;
  payments: IPaymentRecord[];
  
  // Late Fees
  lateFeePercentage?: number;
  lateFeeAmount: number;
  gracePeriodDays: number;
  
  // Recurring
  isRecurring: boolean;
  recurringFrequency?: 'MONTHLY' | 'QUARTERLY' | 'SEMI_ANNUALLY' | 'ANNUALLY';
  recurringStartDate?: Date;
  recurringEndDate?: Date;
  nextRecurringDate?: Date;
  parentInvoiceId?: mongoose.Types.ObjectId;
  
  // Links
  linkedInvoiceId?: mongoose.Types.ObjectId; // For credit/debit notes
  purchaseOrderId?: mongoose.Types.ObjectId;
  deliveryNoteId?: mongoose.Types.ObjectId;
  journalEntryId?: mongoose.Types.ObjectId;
  
  // Approval
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvalWorkflow: Array<{
    level: number;
    approverId: mongoose.Types.ObjectId;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    date?: Date;
    comments?: string;
  }>;
  
  // Template & Branding
  templateId?: mongoose.Types.ObjectId;
  
  // Factoring
  isFactored: boolean;
  factoringCompany?: string;
  factoringDate?: Date;
  factoringAmount?: number;
  
  // E-Invoice
  eInvoiceIRN?: string;
  eInvoiceAckNo?: string;
  eInvoiceAckDate?: Date;
  eInvoiceQRCode?: string;
  
  // Reminders & Dunning
  remindersSent: number;
  lastReminderDate?: Date;
  dunningLevel: number;
  
  // Notes & Attachments
  notes?: string;
  internalNotes?: string;
  attachments: string[];
  
  // Audit
  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  cancelledBy?: mongoose.Types.ObjectId;
  cancellationReason?: string;
  cancellationDate?: Date;
}

const InvoiceSchema = new Schema<IInvoice>({
  invoiceNumber: { type: String, required: true, unique: true },
  workOrderNumber: String,
  invoiceType: { type: String, enum: ['SALES', 'PURCHASE', 'CREDIT_NOTE', 'DEBIT_NOTE'], required: true },
  status: { type: String, enum: ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'SENT', 'VIEWED', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED', 'FACTORED'], default: 'DRAFT' },
  
  customerId: { type: Schema.Types.ObjectId, ref: 'Contact' },
  vendorId: { type: Schema.Types.ObjectId, ref: 'Contact' },
  partyName: { type: String, required: true },
  partyEmail: String,
  partyAddress: String,
  partyGSTIN: String,
  
  gstEnabled: { type: Boolean, default: false },
  gstRate: Number,
  cgstAmount: { type: Number, default: 0 },
  sgstAmount: { type: Number, default: 0 },
  igstAmount: { type: Number, default: 0 },
  gstTotalAmount: { type: Number, default: 0 },
  
  invoiceDate: { type: Date, required: true },
  dueDate: { type: Date, required: true },
  sentDate: Date,
  viewedDate: Date,
  paidDate: Date,
  
  currency: { type: String, default: 'INR' },
  exchangeRate: { type: Number, default: 1 },
  baseCurrency: { type: String, default: 'INR' },
  
  lineItems: [{
    description: { type: String, required: true },
    quantity: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
    taxRate: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    amount: { type: Number, required: true },
    account: { type: Schema.Types.ObjectId, ref: 'ChartOfAccount' },
    costCenter: { type: Schema.Types.ObjectId, ref: 'CostCenter' }
  }],
  
  subtotal: { type: Number, required: true },
  totalTax: { type: Number, default: 0 },
  totalDiscount: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  amountInBaseCurrency: { type: Number, required: true },
  
  paymentTerms: { type: String, enum: ['NET_15', 'NET_30', 'NET_60', 'NET_90', 'DUE_ON_RECEIPT', 'CUSTOM'], default: 'NET_30' },
  customPaymentTerms: String,
  earlyPaymentDiscount: Number,
  earlyPaymentDays: Number,
  paidAmount: { type: Number, default: 0 },
  balanceAmount: { type: Number, default: 0 },
  payments: [{
    date: { type: Date, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    exchangeRate: { type: Number, default: 1 },
    amountInBaseCurrency: { type: Number, required: true },
    paymentMethod: { type: String, required: true },
    reference: String,
    voucherId: { type: Schema.Types.ObjectId, ref: 'Voucher' },
    notes: String
  }],
  
  lateFeePercentage: Number,
  lateFeeAmount: { type: Number, default: 0 },
  gracePeriodDays: { type: Number, default: 0 },
  
  isRecurring: { type: Boolean, default: false },
  recurringFrequency: { type: String, enum: ['MONTHLY', 'QUARTERLY', 'SEMI_ANNUALLY', 'ANNUALLY'] },
  recurringStartDate: Date,
  recurringEndDate: Date,
  nextRecurringDate: Date,
  parentInvoiceId: { type: Schema.Types.ObjectId, ref: 'Invoice' },
  
  linkedInvoiceId: { type: Schema.Types.ObjectId, ref: 'Invoice' },
  purchaseOrderId: { type: Schema.Types.ObjectId, ref: 'PurchaseOrder' },
  deliveryNoteId: { type: Schema.Types.ObjectId, ref: 'DeliveryNote' },
  journalEntryId: { type: Schema.Types.ObjectId, ref: 'JournalEntry' },
  
  approvalStatus: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' },
  approvalWorkflow: [{
    level: Number,
    approverId: { type: Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' },
    date: Date,
    comments: String
  }],
  
  templateId: { type: Schema.Types.ObjectId, ref: 'InvoiceTemplate' },
  
  isFactored: { type: Boolean, default: false },
  factoringCompany: String,
  factoringDate: Date,
  factoringAmount: Number,
  
  eInvoiceIRN: String,
  eInvoiceAckNo: String,
  eInvoiceAckDate: Date,
  eInvoiceQRCode: String,
  
  remindersSent: { type: Number, default: 0 },
  lastReminderDate: Date,
  dunningLevel: { type: Number, default: 0 },
  
  notes: String,
  internalNotes: String,
  attachments: [String],
  
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  cancelledBy: { type: Schema.Types.ObjectId, ref: 'User' },
  cancellationReason: String,
  cancellationDate: Date
}, { timestamps: true });

InvoiceSchema.index({ invoiceNumber: 1 });
InvoiceSchema.index({ status: 1, dueDate: 1 });
InvoiceSchema.index({ customerId: 1, status: 1 });
InvoiceSchema.index({ invoiceDate: 1 });

export default mongoose.model<IInvoice>('Invoice', InvoiceSchema);
