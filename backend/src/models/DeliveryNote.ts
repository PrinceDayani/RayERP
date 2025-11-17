import mongoose, { Document, Schema } from 'mongoose';

export interface IDeliveryNoteItem {
  description: string;
  quantity: number;
  deliveredQuantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface IDeliveryNote extends Document {
  deliveryNoteNumber: string;
  customerId: mongoose.Types.ObjectId;
  customerName: string;
  deliveryDate: Date;
  status: 'DRAFT' | 'DISPATCHED' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';
  items: IDeliveryNoteItem[];
  totalAmount: number;
  deliveryAddress: string;
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const DeliveryNoteSchema = new Schema<IDeliveryNote>({
  deliveryNoteNumber: {
    type: String,
    required: true,
    unique: true
  },
  customerId: {
    type: Schema.Types.ObjectId,
    ref: 'Contact',
    required: true
  },
  customerName: {
    type: String,
    required: true
  },
  deliveryDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['DRAFT', 'DISPATCHED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'],
    default: 'DRAFT'
  },
  items: [{
    description: { type: String, required: true },
    quantity: { type: Number, required: true },
    deliveredQuantity: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
    totalPrice: { type: Number, required: true }
  }],
  totalAmount: {
    type: Number,
    required: true
  },
  deliveryAddress: {
    type: String,
    required: true
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

DeliveryNoteSchema.index({ deliveryNoteNumber: 1 });
DeliveryNoteSchema.index({ customerId: 1 });

export default mongoose.model<IDeliveryNote>('DeliveryNote', DeliveryNoteSchema);