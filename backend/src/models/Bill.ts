import mongoose, { Document, Schema } from 'mongoose';

export interface IBillItem {
  description: string;
  amount: number;
  paidAmount: number;
  balanceAmount: number;
}

export interface IBill extends Document {
  accountId: mongoose.Types.ObjectId;
  billNumber: string;
  billDate: Date;
  dueDate?: Date;
  vendor?: string;
  items: IBillItem[];
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  status: 'pending' | 'partial' | 'paid';
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const BillSchema = new Schema<IBill>({
  accountId: { type: Schema.Types.ObjectId, ref: 'Account', required: true },
  billNumber: { type: String, required: true, unique: true },
  billDate: { type: Date, required: true },
  dueDate: { type: Date },
  vendor: { type: String, trim: true },
  items: [{
    description: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    paidAmount: { type: Number, default: 0, min: 0 },
    balanceAmount: { type: Number, required: true, min: 0 }
  }],
  totalAmount: { type: Number, required: true, min: 0 },
  paidAmount: { type: Number, default: 0, min: 0 },
  balanceAmount: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['pending', 'partial', 'paid'], default: 'pending' },
  notes: { type: String },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

BillSchema.index({ accountId: 1, status: 1 });
BillSchema.index({ billNumber: 1 });

export const Bill = mongoose.model<IBill>('Bill', BillSchema);
