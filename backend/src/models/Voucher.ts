import mongoose, { Document, Schema } from 'mongoose';

export type VoucherType = 'payment' | 'receipt' | 'contra' | 'sales' | 'purchase' | 'journal' | 'debit_note' | 'credit_note';

export interface IVoucherLine {
  accountId: mongoose.Types.ObjectId;
  debit: number;
  credit: number;
  description?: string;
  costCenter?: string;
  departmentId?: mongoose.Types.ObjectId;
  projectId?: mongoose.Types.ObjectId;
}

export interface IVoucher extends Document {
  voucherType: VoucherType;
  voucherNumber: string;
  date: Date;
  reference?: string;
  narration: string;
  lines: IVoucherLine[];
  totalAmount: number;
  isPosted: boolean;
  status: 'draft' | 'posted' | 'cancelled';
  partyId?: mongoose.Types.ObjectId;
  partyName?: string;
  paymentMode?: 'cash' | 'bank' | 'cheque' | 'upi' | 'card' | 'neft' | 'rtgs';
  chequeNumber?: string;
  chequeDate?: Date;
  bankAccountId?: mongoose.Types.ObjectId;
  invoiceNumber?: string;
  invoiceDate?: Date;
  dueDate?: Date;
  taxAmount?: number;
  discountAmount?: number;
  attachments?: string[];
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  cancelledBy?: mongoose.Types.ObjectId;
  cancelledAt?: Date;
  cancellationReason?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const VoucherLineSchema = new Schema<IVoucherLine>({
  accountId: { type: Schema.Types.ObjectId, ref: 'ChartOfAccount', required: true },
  debit: { type: Number, default: 0, min: 0 },
  credit: { type: Number, default: 0, min: 0 },
  description: { type: String, trim: true },
  costCenter: { type: String, trim: true },
  departmentId: { type: Schema.Types.ObjectId, ref: 'Department' },
  projectId: { type: Schema.Types.ObjectId, ref: 'Project' }
});

const VoucherSchema = new Schema<IVoucher>({
  voucherType: { 
    type: String, 
    enum: ['payment', 'receipt', 'contra', 'sales', 'purchase', 'journal', 'debit_note', 'credit_note'], 
    required: true,
    index: true
  },
  voucherNumber: { type: String, required: true, unique: true, index: true },
  date: { type: Date, required: true, index: true },
  reference: { type: String, trim: true },
  narration: { type: String, required: true, trim: true },
  lines: { type: [VoucherLineSchema], required: true, validate: [arr => arr.length > 0, 'At least one line required'] },
  totalAmount: { type: Number, required: true, min: 0 },
  isPosted: { type: Boolean, default: false, index: true },
  status: { type: String, enum: ['draft', 'posted', 'cancelled'], default: 'draft', index: true },
  partyId: { type: Schema.Types.ObjectId, ref: 'ChartOfAccount' },
  partyName: { type: String, trim: true },
  paymentMode: { type: String, enum: ['cash', 'bank', 'cheque', 'upi', 'card', 'neft', 'rtgs'] },
  chequeNumber: { type: String, trim: true },
  chequeDate: { type: Date },
  bankAccountId: { type: Schema.Types.ObjectId, ref: 'ChartOfAccount' },
  invoiceNumber: { type: String, trim: true },
  invoiceDate: { type: Date },
  dueDate: { type: Date },
  taxAmount: { type: Number, default: 0, min: 0 },
  discountAmount: { type: Number, default: 0, min: 0 },
  attachments: [{ type: String }],
  approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  approvedAt: { type: Date },
  cancelledBy: { type: Schema.Types.ObjectId, ref: 'User' },
  cancelledAt: { type: Date },
  cancellationReason: { type: String, trim: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

VoucherSchema.pre('save', function(next) {
  const totalDebit = this.lines.reduce((sum, line) => sum + line.debit, 0);
  const totalCredit = this.lines.reduce((sum, line) => sum + line.credit, 0);
  
  if (Math.abs(totalDebit - totalCredit) > 0.01) {
    return next(new Error('Total debits must equal total credits'));
  }
  
  if (this.isPosted) {
    this.status = 'posted';
  }
  
  next();
});

VoucherSchema.index({ voucherType: 1, date: -1 });
VoucherSchema.index({ status: 1, date: -1 });
VoucherSchema.index({ partyId: 1 });
VoucherSchema.index({ createdBy: 1 });

export const Voucher = mongoose.model<IVoucher>('Voucher', VoucherSchema);
