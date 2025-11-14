import mongoose, { Document, Schema } from 'mongoose';

export interface IBillDetail extends Document {
  accountId: mongoose.Types.ObjectId;
  billReference: string;
  billDate: Date;
  billAmount: number;
  paidAmount: number;
  balanceAmount: number;
  dueDate?: Date;
  status: 'pending' | 'partial' | 'paid';
  createdAt: Date;
  updatedAt: Date;
}

const BillDetailSchema = new Schema<IBillDetail>({
  accountId: {
    type: Schema.Types.ObjectId,
    ref: 'Account',
    required: true
  },
  billReference: {
    type: String,
    required: true,
    trim: true
  },
  billDate: {
    type: Date,
    required: true
  },
  billAmount: {
    type: Number,
    required: true,
    min: 0
  },
  paidAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  balanceAmount: {
    type: Number,
    required: true,
    min: 0
  },
  dueDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['pending', 'partial', 'paid'],
    default: 'pending'
  }
}, {
  timestamps: true
});

BillDetailSchema.index({ accountId: 1, status: 1 });
BillDetailSchema.index({ billReference: 1 });

export const BillDetail = mongoose.model<IBillDetail>('BillDetail', BillDetailSchema);
