import mongoose, { Schema, Document } from 'mongoose';

export interface IVarianceItem {
  category: string;
  budgeted: number;
  actual: number;
  variance: number;
  variancePercent: number;
  status: 'favorable' | 'unfavorable' | 'neutral';
}

export interface IBudgetVariance extends Document {
  budget: mongoose.Types.ObjectId;
  period: {
    startDate: Date;
    endDate: Date;
    type: 'monthly' | 'quarterly' | 'yearly' | 'custom';
  };
  totalBudgeted: number;
  totalActual: number;
  totalVariance: number;
  totalVariancePercent: number;
  overallStatus: 'favorable' | 'unfavorable' | 'neutral';
  items: IVarianceItem[];
  insights: string[];
  recommendations: string[];
  generatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const VarianceItemSchema = new Schema({
  category: { type: String, required: true },
  budgeted: { type: Number, required: true },
  actual: { type: Number, required: true },
  variance: { type: Number, required: true },
  variancePercent: { type: Number, required: true },
  status: { type: String, enum: ['favorable', 'unfavorable', 'neutral'], required: true }
}, { _id: false });

const BudgetVarianceSchema = new Schema<IBudgetVariance>({
  budget: { type: Schema.Types.ObjectId, ref: 'Budget', required: true },
  period: {
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    type: { type: String, enum: ['monthly', 'quarterly', 'yearly', 'custom'], required: true }
  },
  totalBudgeted: { type: Number, required: true },
  totalActual: { type: Number, required: true },
  totalVariance: { type: Number, required: true },
  totalVariancePercent: { type: Number, required: true },
  overallStatus: { type: String, enum: ['favorable', 'unfavorable', 'neutral'], required: true },
  items: [VarianceItemSchema],
  insights: [String],
  recommendations: [String],
  generatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

BudgetVarianceSchema.index({ budget: 1, 'period.startDate': -1 });
BudgetVarianceSchema.index({ createdAt: -1 });

export default mongoose.model<IBudgetVariance>('BudgetVariance', BudgetVarianceSchema);
