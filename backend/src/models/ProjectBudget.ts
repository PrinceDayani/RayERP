import mongoose, { Schema, Document } from 'mongoose';

export interface IProjectBudget extends Document {
  projectId: mongoose.Types.ObjectId;
  totalBudget: number;
  actualSpend: number;
  categories: {
    name: string;
    budgeted: number;
    actual: number;
  }[];
  fiscalYear: string;
  status: 'on-track' | 'at-risk' | 'over-budget';
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectBudgetSchema = new Schema<IProjectBudget>({
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  totalBudget: { type: Number, required: true },
  actualSpend: { type: Number, default: 0 },
  categories: [{
    name: String,
    budgeted: Number,
    actual: { type: Number, default: 0 }
  }],
  fiscalYear: { type: String, required: true },
  status: { type: String, enum: ['on-track', 'at-risk', 'over-budget'], default: 'on-track' },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

export default mongoose.model<IProjectBudget>('ProjectBudget', ProjectBudgetSchema);
