import mongoose, { Schema, Document } from 'mongoose';

export interface IReferenceBalance extends Document {
  journalEntryId?: mongoose.Types.ObjectId;
  entryNumber: string;
  reference: string;
  date: Date;
  description: string;
  accountId: mongoose.Types.ObjectId;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  status: 'OUTSTANDING' | 'PARTIALLY_PAID' | 'FULLY_PAID';
  payments: Array<{
    paymentId: mongoose.Types.ObjectId;
    paymentNumber: string;
    amount: number;
    date: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const ReferenceBalanceSchema = new Schema<IReferenceBalance>({
  journalEntryId: { type: Schema.Types.ObjectId, ref: 'JournalEntry', required: false },
  entryNumber: { type: String, required: true },
  reference: { type: String, required: true },
  date: { type: Date, required: true },
  description: { type: String, required: true },
  accountId: { type: Schema.Types.ObjectId, ref: 'ChartOfAccount', required: true },
  totalAmount: { type: Number, required: true },
  paidAmount: { type: Number, default: 0 },
  outstandingAmount: { type: Number, required: true },
  status: { type: String, enum: ['OUTSTANDING', 'PARTIALLY_PAID', 'FULLY_PAID'], default: 'OUTSTANDING' },
  payments: [{
    paymentId: { type: Schema.Types.ObjectId, ref: 'Payment', required: true },
    paymentNumber: { type: String, required: true },
    amount: { type: Number, required: true },
    date: { type: Date, required: true }
  }]
}, { timestamps: true });

ReferenceBalanceSchema.index({ journalEntryId: 1 });
ReferenceBalanceSchema.index({ reference: 1 });
ReferenceBalanceSchema.index({ accountId: 1, status: 1 });
ReferenceBalanceSchema.index({ status: 1, date: -1 });
ReferenceBalanceSchema.index({ outstandingAmount: 1 }, { partialFilterExpression: { outstandingAmount: { $gt: 0 } } });

ReferenceBalanceSchema.pre('save', function(next) {
  this.outstandingAmount = this.totalAmount - this.paidAmount;
  if (this.outstandingAmount <= 0) this.status = 'FULLY_PAID';
  else if (this.paidAmount > 0) this.status = 'PARTIALLY_PAID';
  else this.status = 'OUTSTANDING';
  next();
});

export default mongoose.model<IReferenceBalance>('ReferenceBalance', ReferenceBalanceSchema);
