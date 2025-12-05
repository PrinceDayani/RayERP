import mongoose, { Schema, Document } from 'mongoose';

export interface IBudgetTemplate extends Document {
  templateName: string;
  description: string;
  category: 'department' | 'project' | 'special' | 'custom';
  isPublic: boolean;
  createdBy: mongoose.Types.ObjectId;
  structure: {
    budgetName: string;
    totalAmount: number;
    categories: {
      name: string;
      allocatedAmount: number;
      percentage: number;
    }[];
    fiscalYear?: string;
    startDate?: Date;
    endDate?: Date;
  };
  usageCount: number;
  tags: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BudgetTemplateSchema = new Schema<IBudgetTemplate>({
  templateName: { type: String, required: true },
  description: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['department', 'project', 'special', 'custom'],
    required: true 
  },
  isPublic: { type: Boolean, default: false },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  structure: {
    budgetName: String,
    totalAmount: Number,
    categories: [{
      name: String,
      allocatedAmount: Number,
      percentage: Number
    }],
    fiscalYear: String,
    startDate: Date,
    endDate: Date
  },
  usageCount: { type: Number, default: 0 },
  tags: [String],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

BudgetTemplateSchema.index({ templateName: 1 });
BudgetTemplateSchema.index({ category: 1, isActive: 1 });
BudgetTemplateSchema.index({ createdBy: 1 });
BudgetTemplateSchema.index({ isPublic: 1, isActive: 1 });

const BudgetTemplate = mongoose.model<IBudgetTemplate>('BudgetTemplate', BudgetTemplateSchema);
export { BudgetTemplate };
export default BudgetTemplate;
