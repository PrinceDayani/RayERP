import mongoose, { Document, Schema } from 'mongoose';

export interface IPaymentAllocation {
  itemIndex: number;
  amount: number;
}

export interface IBillPayment extends Document {
  billId: mongoose.Types.ObjectId;
  paymentDate: Date;
  amount: number;
  paymentMethod: string;
  reference?: string;
  allocations: IPaymentAllocation[];
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const BillPaymentSchema = new Schema<IBillPayment>({
  billId: { type: Schema.Types.ObjectId, ref: 'Bill', required: true },
  paymentDate: { type: Date, required: true },
  amount: { type: Number, required: true, min: 0 },
  paymentMethod: { type: String, required: true },
  reference: { type: String },
  allocations: [{
    itemIndex: { type: Number, required: true },
    amount: { type: Number, required: true, min: 0 }
  }],
  notes: { type: String },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

BillPaymentSchema.index({ billId: 1 });

export const BillPayment = mongoose.model<IBillPayment>('BillPayment', BillPaymentSchema);
