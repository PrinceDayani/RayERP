import mongoose, { Document, Schema } from 'mongoose';

export interface IPurchaseOrderItem {
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  account?: mongoose.Types.ObjectId;
}

export interface IPurchaseOrder extends Document {
  poNumber: string;
  vendorId: mongoose.Types.ObjectId;
  vendorName: string;
  poDate: Date;
  expectedDeliveryDate: Date;
  status: 'DRAFT' | 'SENT' | 'ACKNOWLEDGED' | 'PARTIALLY_RECEIVED' | 'RECEIVED' | 'CANCELLED';
  items: IPurchaseOrderItem[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PurchaseOrderSchema = new Schema<IPurchaseOrder>({
  poNumber: {
    type: String,
    required: true,
    unique: true
  },
  vendorId: {
    type: Schema.Types.ObjectId,
    ref: 'Contact',
    required: true
  },
  vendorName: {
    type: String,
    required: true
  },
  poDate: {
    type: Date,
    required: true
  },
  expectedDeliveryDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['DRAFT', 'SENT', 'ACKNOWLEDGED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED'],
    default: 'DRAFT'
  },
  items: [{
    description: { type: String, required: true },
    quantity: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
    account: { type: Schema.Types.ObjectId, ref: 'Account' }
  }],
  subtotal: {
    type: Number,
    required: true
  },
  taxAmount: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'INR'
  },
  notes: String,
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

PurchaseOrderSchema.index({ poNumber: 1 });
PurchaseOrderSchema.index({ vendorId: 1 });

export default mongoose.model<IPurchaseOrder>('PurchaseOrder', PurchaseOrderSchema);