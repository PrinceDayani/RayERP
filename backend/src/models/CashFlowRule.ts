import mongoose, { Document, Schema } from 'mongoose';

export interface ICashFlowRule extends Document {
  name: string;
  description?: string;
  category: 'OPERATING' | 'INVESTING' | 'FINANCING' | 'NON_CASH';
  priority: number;
  isActive: boolean;
  conditions: {
    accountIds?: mongoose.Types.ObjectId[];
    vendorIds?: mongoose.Types.ObjectId[];
    customerIds?: mongoose.Types.ObjectId[];
    descriptionContains?: string[];
    descriptionRegex?: string;
    sourceTypes?: string[];
    amountMin?: number;
    amountMax?: number;
  };
  createdBy: mongoose.Types.ObjectId;
  lastAppliedAt?: Date;
  applicationCount: number;
}

const CashFlowRuleSchema = new Schema<ICashFlowRule>({
  name: { type: String, required: true },
  description: String,
  category: { 
    type: String, 
    enum: ['OPERATING', 'INVESTING', 'FINANCING', 'NON_CASH'],
    required: true 
  },
  priority: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  conditions: {
    accountIds: [{ type: Schema.Types.ObjectId, ref: 'Account' }],
    vendorIds: [{ type: Schema.Types.ObjectId, ref: 'Contact' }],
    customerIds: [{ type: Schema.Types.ObjectId, ref: 'Contact' }],
    descriptionContains: [String],
    descriptionRegex: String,
    sourceTypes: [String],
    amountMin: Number,
    amountMax: Number
  },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  lastAppliedAt: Date,
  applicationCount: { type: Number, default: 0 }
}, { timestamps: true });

CashFlowRuleSchema.index({ isActive: 1, priority: -1 });

export const CashFlowRule = mongoose.model<ICashFlowRule>('CashFlowRule', CashFlowRuleSchema);
