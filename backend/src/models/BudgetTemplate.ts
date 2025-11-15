import mongoose, { Document, Schema } from 'mongoose';

export interface ITemplateAccount {
  accountId: mongoose.Types.ObjectId;
  percentage: number;
  fixedAmount?: number;
}

export interface IBudgetTemplate extends Document {
  name: string;
  description?: string;
  templateType: 'department' | 'project' | 'custom';
  departmentId?: mongoose.Types.ObjectId;
  accounts: ITemplateAccount[];
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const BudgetTemplateSchema = new Schema<IBudgetTemplate>({
  name: { type: String, required: true },
  description: String,
  templateType: { type: String, enum: ['department', 'project', 'custom'], required: true },
  departmentId: { type: Schema.Types.ObjectId, ref: 'Department' },
  accounts: [{
    accountId: { type: Schema.Types.ObjectId, ref: 'Account', required: true },
    percentage: { type: Number, min: 0, max: 100 },
    fixedAmount: Number
  }],
  isActive: { type: Boolean, default: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

export const BudgetTemplate = mongoose.model<IBudgetTemplate>('BudgetTemplate', BudgetTemplateSchema);
