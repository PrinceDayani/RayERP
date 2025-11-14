import mongoose, { Document, Schema } from 'mongoose';

export interface IGLBudget extends Document {
  accountId: mongoose.Types.ObjectId;
  fiscalYear: string;
  budgetAmount: number;
  actualAmount: number;
  variance: number;
  utilizationPercent: number;
  createdAt: Date;
  updatedAt: Date;
}

const GLBudgetSchema = new Schema<IGLBudget>({
  accountId: {
    type: Schema.Types.ObjectId,
    ref: 'Account',
    required: true
  },
  fiscalYear: {
    type: String,
    required: true,
    trim: true
  },
  budgetAmount: {
    type: Number,
    required: true,
    min: 0
  },
  actualAmount: {
    type: Number,
    default: 0
  },
  variance: {
    type: Number,
    default: 0
  },
  utilizationPercent: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

GLBudgetSchema.index({ accountId: 1, fiscalYear: 1 }, { unique: true });

export const GLBudget = mongoose.model<IGLBudget>('GLBudget', GLBudgetSchema);
