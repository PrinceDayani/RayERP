import mongoose, { Document, Schema } from 'mongoose';

export interface IBOQItem extends Document {
  projectId: mongoose.Types.ObjectId;
  itemCode: string;
  description: string;
  unit: string;
  quantity: number;
  rate: number;
  amount: number;
  category: 'civil' | 'electrical' | 'mechanical' | 'plumbing' | 'other';
  workPackage?: string;
  actualQuantity: number;
  actualCost: number;
  completedQuantity: number;
  percentComplete: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BOQItemSchema = new Schema<IBOQItem>({
  projectId: {
    type: Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  itemCode: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  unit: {
    type: String,
    required: true,
    trim: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  rate: {
    type: Number,
    required: true,
    min: 0
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    required: true,
    enum: ['civil', 'electrical', 'mechanical', 'plumbing', 'other']
  },
  workPackage: {
    type: String,
    trim: true
  },
  actualQuantity: {
    type: Number,
    default: 0,
    min: 0
  },
  actualCost: {
    type: Number,
    default: 0,
    min: 0
  },
  completedQuantity: {
    type: Number,
    default: 0,
    min: 0
  },
  percentComplete: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

BOQItemSchema.index({ projectId: 1, itemCode: 1 }, { unique: true });
BOQItemSchema.index({ category: 1 });

export const BOQItem = mongoose.model<IBOQItem>('BOQItem', BOQItemSchema);