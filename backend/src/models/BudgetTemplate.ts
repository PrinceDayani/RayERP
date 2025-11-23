import mongoose, { Document, Schema } from 'mongoose';

export interface ITemplateItem {
  name: string;
  description?: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
}

export interface ITemplateCategory {
  name: string;
  type: 'labor' | 'materials' | 'equipment' | 'overhead';
  allocatedAmount: number;
  items: ITemplateItem[];
}

export interface IBudgetTemplate extends Document {
  name: string;
  description?: string;
  projectType: string;
  categories: ITemplateCategory[];
  isDefault: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const BudgetTemplateSchema = new Schema<IBudgetTemplate>({
  name: { type: String, required: true },
  description: String,
  projectType: { type: String, required: true },
  categories: [{
    name: { type: String, required: true },
    type: { type: String, enum: ['labor', 'materials', 'equipment', 'overhead'], required: true },
    allocatedAmount: { type: Number, default: 0 },
    items: [{
      name: { type: String, required: true },
      description: String,
      quantity: { type: Number, required: true, default: 1 },
      unitCost: { type: Number, required: true, default: 0 },
      totalCost: { type: Number, required: true, default: 0 }
    }]
  }],
  isDefault: { type: Boolean, default: false },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

export const BudgetTemplate = mongoose.model<IBudgetTemplate>('BudgetTemplate', BudgetTemplateSchema);
