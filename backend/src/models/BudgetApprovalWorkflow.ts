import mongoose, { Document, Schema } from 'mongoose';

export interface IApprovalLevel {
  level: number;
  name: string;
  requiredRole: string;
  amountThreshold: number;
  approvers: mongoose.Types.ObjectId[];
  status: 'pending' | 'approved' | 'rejected' | 'skipped';
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  comments?: string;
  deadline?: Date;
}

export interface IBudgetApprovalWorkflow extends Document {
  budgetId: mongoose.Types.ObjectId;
  enabled: boolean;
  currentLevel: number;
  totalLevels: number;
  levels: IApprovalLevel[];
  autoApproveUnder: number;
  status: 'pending' | 'in-progress' | 'approved' | 'rejected';
  startedAt: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const approvalLevelSchema = new Schema<IApprovalLevel>({
  level: { type: Number, required: true },
  name: { type: String, required: true },
  requiredRole: { type: String, required: true },
  amountThreshold: { type: Number, default: 0 },
  approvers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected', 'skipped'], 
    default: 'pending' 
  },
  approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  approvedAt: Date,
  comments: String,
  deadline: Date
});

const budgetApprovalWorkflowSchema = new Schema<IBudgetApprovalWorkflow>({
  budgetId: { type: Schema.Types.ObjectId, ref: 'Budget', required: true, unique: true },
  enabled: { type: Boolean, default: true },
  currentLevel: { type: Number, default: 1 },
  totalLevels: { type: Number, required: true },
  levels: [approvalLevelSchema],
  autoApproveUnder: { type: Number, default: 100000 },
  status: { 
    type: String, 
    enum: ['pending', 'in-progress', 'approved', 'rejected'], 
    default: 'pending' 
  },
  startedAt: { type: Date, default: Date.now },
  completedAt: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

budgetApprovalWorkflowSchema.index({ budgetId: 1 });
budgetApprovalWorkflowSchema.index({ status: 1, currentLevel: 1 });
budgetApprovalWorkflowSchema.index({ 'levels.approvers': 1, 'levels.status': 1 });

export default mongoose.model<IBudgetApprovalWorkflow>('BudgetApprovalWorkflow', budgetApprovalWorkflowSchema);
