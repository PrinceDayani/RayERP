// src/models/Finance.ts
import mongoose, { Schema, Document } from 'mongoose';

// Base interface for common fields
export interface IFinanceBase extends Document {
    type: 'payment' | 'invoice';
    customerId?: mongoose.Types.ObjectId;
    vendorId?: mongoose.Types.ObjectId;
    partyName: string;
    partyEmail?: string;
    partyAddress?: string;
    partyGSTIN?: string;
    currency: string;
    exchangeRate: number;
    totalAmount: number;
    baseAmount: number;
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

// Payment-specific fields
export interface IPayment extends IFinanceBase {
    type: 'payment';
    paymentNumber: string;
    paymentType: 'invoice-based' | 'independent' | 'advance';
    paymentDate: Date;
    paymentMethod: 'CASH' | 'CHEQUE' | 'BANK_TRANSFER' | 'UPI' | 'CARD' | 'NEFT' | 'RTGS' | 'WALLET';
    bankAccount?: string;
    reference?: string;
    allocatedAmount?: number;
    unappliedAmount?: number;
    allocations: Array<{
        invoiceId: mongoose.Types.ObjectId;
        invoiceNumber: string;
        amount: number;
        allocationDate: Date;
        accountId?: mongoose.Types.ObjectId;
    }>;
    status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'REFUNDED' | 'DISPUTED';
    approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
    approvedBy?: mongoose.Types.ObjectId;
    approvedAt?: Date;
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
}

// Invoice-specific fields
export interface IInvoice extends IFinanceBase {
    type: 'invoice';
    invoiceNumber: string;
    invoiceType: 'SALES' | 'PURCHASE' | 'CREDIT_NOTE' | 'DEBIT_NOTE';
    status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'SENT' | 'VIEWED' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'CANCELLED' | 'FACTORED';
    invoiceDate: Date;
    dueDate: Date;
    sentDate?: Date;
    viewedDate?: Date;
    paidDate?: Date;
    lineItems: Array<{
        description: string;
        quantity: number;
        unitPrice: number;
        taxRate: number;
        taxAmount: number;
        discount: number;
        amount: number;
        account?: mongoose.Types.ObjectId;
        costCenter?: mongoose.Types.ObjectId;
    }>;
    subtotal: number;
    totalTax: number;
    totalDiscount: number;
    totalAmount: number;
    amountInBaseCurrency: number;
    paymentTerms: 'NET_15' | 'NET_30' | 'NET_60' | 'NET_90' | 'DUE_ON_RECEIPT' | 'CUSTOM';
    customPaymentTerms?: string;
    earlyPaymentDiscount?: number;
    earlyPaymentDays?: number;
    paidAmount: number;
    balanceAmount: number;
    payments: Array<{
        date: Date;
        amount: number;
        currency: string;
        exchangeRate: number;
        amountInBaseCurrency: number;
        paymentMethod: string;
        reference?: string;
        voucherId?: mongoose.Types.ObjectId;
        notes?: string;
    }>;
    lateFeePercentage?: number;
    lateFeeAmount: number;
    gracePeriodDays: number;
    isRecurring: boolean;
    recurringFrequency?: 'MONTHLY' | 'QUARTERLY' | 'SEMI_ANNUALLY' | 'ANNUALLY';
    recurringStartDate?: Date;
    recurringEndDate?: Date;
    nextRecurringDate?: Date;
    parentInvoiceId?: mongoose.Types.ObjectId;
    linkedInvoiceId?: mongoose.Types.ObjectId;
    purchaseOrderId?: mongoose.Types.ObjectId;
    deliveryNoteId?: mongoose.Types.ObjectId;
    journalEntryId?: mongoose.Types.ObjectId;
    approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
    approvalWorkflow: Array<{
        level: number;
        approverId: mongoose.Types.ObjectId;
        status: 'PENDING' | 'APPROVED' | 'REJECTED';
        date?: Date;
        comments?: string;
    }>;
    templateId?: mongoose.Types.ObjectId;
    isFactored: boolean;
    factoringCompany?: string;
    factoringDate?: Date;
    factoringAmount?: number;
    eInvoiceIRN?: string;
    eInvoiceAckNo?: string;
    eInvoiceAckDate?: Date;
    eInvoiceQRCode?: string;
    remindersSent: number;
    lastReminderDate?: Date;
    dunningLevel: number;
    notes?: string;
    internalNotes?: string;
    attachments: string[];
}

const FinanceSchemaFields: any = {
    type: { type: String, enum: ['payment', 'invoice'], required: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'Contact' },
    vendorId: { type: Schema.Types.ObjectId, ref: 'Contact' },
    partyName: { type: String, required: true },
    partyEmail: String,
    partyAddress: String,
    partyGSTIN: String,
    currency: { type: String, default: 'INR' },
    exchangeRate: { type: Number, default: 1 },
    totalAmount: { type: Number, required: true },
    baseAmount: { type: Number, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
};

const FinanceSchema = new Schema(FinanceSchemaFields, { timestamps: true, discriminatorKey: 'type' });

// Payment discriminator schema
const PaymentSchema = new Schema({
    paymentNumber: { type: String, required: true, unique: true },
    paymentType: { type: String, enum: ['invoice-based', 'independent', 'advance'], default: 'invoice-based' },
    paymentDate: { type: Date, required: true },
    paymentMethod: { type: String, enum: ['CASH', 'CHEQUE', 'BANK_TRANSFER', 'UPI', 'CARD', 'NEFT', 'RTGS', 'WALLET'], required: true },
    bankAccount: String,
    reference: String,
    allocatedAmount: { type: Number, default: 0, min: 0 },
    unappliedAmount: { type: Number, default: 0, min: 0 },
    allocations: [{
        invoiceId: { type: Schema.Types.ObjectId, ref: 'Finance', required: true },
        invoiceNumber: { type: String, required: true },
        amount: { type: Number, required: true },
        allocationDate: { type: Date, default: Date.now },
        accountId: { type: Schema.Types.ObjectId, ref: 'ChartOfAccount' },
    }],
    status: { type: String, enum: ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED', 'DISPUTED'], default: 'DRAFT' },
    approvalStatus: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedAt: Date,
    refund: {
        amount: Number,
        reason: String,
        refundDate: Date,
        refundedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    },
    dispute: {
        reason: String,
        status: { type: String, enum: ['OPEN', 'RESOLVED', 'CLOSED'] },
        raisedDate: Date,
        resolvedDate: Date,
    },
    reconciliation: {
        bankStatementId: { type: Schema.Types.ObjectId, ref: 'BankStatement' },
        reconciledDate: Date,
        reconciledBy: { type: Schema.Types.ObjectId, ref: 'User' },
        status: { type: String, enum: ['UNRECONCILED', 'RECONCILED', 'PENDING'], default: 'UNRECONCILED' },
    },
    journalEntryId: { type: Schema.Types.ObjectId, ref: 'JournalEntry' },
    receiptGenerated: { type: Boolean, default: false },
    receiptUrl: String,
    remindersSent: { type: Number, default: 0 },
    lastReminderDate: Date,
    notes: String,
    attachments: [String],
});

// Invoice discriminator schema
const InvoiceSchema = new Schema({
    invoiceNumber: { type: String, required: true, unique: true },
    invoiceType: { type: String, enum: ['SALES', 'PURCHASE', 'CREDIT_NOTE', 'DEBIT_NOTE'], required: true },
    status: { type: String, enum: ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'SENT', 'VIEWED', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED', 'FACTORED'], default: 'DRAFT' },
    invoiceDate: { type: Date, required: true },
    dueDate: { type: Date, required: true },
    sentDate: Date,
    viewedDate: Date,
    paidDate: Date,
    lineItems: [{
        description: { type: String, required: true },
        quantity: { type: Number, required: true },
        unitPrice: { type: Number, required: true },
        taxRate: { type: Number, default: 0 },
        taxAmount: { type: Number, default: 0 },
        discount: { type: Number, default: 0 },
        amount: { type: Number, required: true },
        account: { type: Schema.Types.ObjectId, ref: 'ChartOfAccount' },
        costCenter: { type: Schema.Types.ObjectId, ref: 'CostCenter' },
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
        notes: String,
    }],
    lateFeePercentage: Number,
    lateFeeAmount: { type: Number, default: 0 },
    gracePeriodDays: { type: Number, default: 0 },
    isRecurring: { type: Boolean, default: false },
    recurringFrequency: { type: String, enum: ['MONTHLY', 'QUARTERLY', 'SEMI_ANNUALLY', 'ANNUALLY'] },
    recurringStartDate: Date,
    recurringEndDate: Date,
    nextRecurringDate: Date,
    parentInvoiceId: { type: Schema.Types.ObjectId, ref: 'Finance' },
    linkedInvoiceId: { type: Schema.Types.ObjectId, ref: 'Finance' },
    purchaseOrderId: { type: Schema.Types.ObjectId, ref: 'PurchaseOrder' },
    deliveryNoteId: { type: Schema.Types.ObjectId, ref: 'DeliveryNote' },
    journalEntryId: { type: Schema.Types.ObjectId, ref: 'JournalEntry' },
    approvalStatus: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' },
    approvalWorkflow: [{
        level: Number,
        approverId: { type: Schema.Types.ObjectId, ref: 'User' },
        status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' },
        date: Date,
        comments: String,
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
});

// Indexes for performance
FinanceSchema.index({ type: 1, status: 1 });
FinanceSchema.index({ customerId: 1, type: 1 });
FinanceSchema.index({ vendorId: 1, type: 1 });
FinanceSchema.index({ createdAt: -1 });
PaymentSchema.index({ paymentNumber: 1 });
PaymentSchema.index({ paymentDate: -1 });
InvoiceSchema.index({ invoiceNumber: 1 });
InvoiceSchema.index({ invoiceDate: -1, dueDate: -1 });

const Finance = mongoose.model<IFinanceBase>('Finance', FinanceSchema);
const Payment = Finance.discriminator<IPayment>('payment', PaymentSchema);
const Invoice = Finance.discriminator<IInvoice>('invoice', InvoiceSchema);

export default Finance;
export { Payment, Invoice };
