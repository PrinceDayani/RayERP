import mongoose, { Document, Schema } from 'mongoose';

export interface IAllocationTarget {
  departmentId?: mongoose.Types.ObjectId;
  projectId?: mongoose.Types.ObjectId;
  costCenterId?: mongoose.Types.ObjectId;
  percentage: number;
  accountId: mongoose.Types.ObjectId;
}

export interface IAllocationRule extends Document {
  name: string;
  description?: string;
  sourceAccountId: mongoose.Types.ObjectId;
  targets: IAllocationTarget[];
  frequency: 'manual' | 'daily' | 'weekly' | 'monthly' | 'quarterly';
  isActive: boolean;
  lastRunDate?: Date;
  nextRunDate?: Date;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AllocationTargetSchema = new Schema<IAllocationTarget>({
  departmentId: { type: Schema.Types.ObjectId, ref: 'Department' },
  projectId: { type: Schema.Types.ObjectId, ref: 'Project' },
  costCenterId: { type: Schema.Types.ObjectId, ref: 'CostCenter' },
  percentage: { type: Number, required: true, min: 0, max: 100 },
  accountId: { type: Schema.Types.ObjectId, ref: 'Account', required: true }
});

const AllocationRuleSchema = new Schema<IAllocationRule>({
  name: { type: String, required: true, trim: true },
  description: String,
  sourceAccountId: { type: Schema.Types.ObjectId, ref: 'Account', required: true },
  targets: {
    type: [AllocationTargetSchema],
    validate: {
      validator: function(targets: IAllocationTarget[]) {
        const total = targets.reduce((sum, t) => sum + t.percentage, 0);
        return Math.abs(total - 100) < 0.01;
      },
      message: 'Allocation percentages must total 100%'
    }
  },
  frequency: { type: String, enum: ['manual', 'daily', 'weekly', 'monthly', 'quarterly'], default: 'manual' },
  isActive: { type: Boolean, default: true },
  lastRunDate: Date,
  nextRunDate: Date,
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

export default mongoose.model<IAllocationRule>('AllocationRule', AllocationRuleSchema);
