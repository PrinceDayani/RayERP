import mongoose, { Document, Schema } from 'mongoose';

export interface ICostAllocation extends Document {
  sourceCostCenterId: mongoose.Types.ObjectId;
  allocationRules: {
    targetCostCenterId: mongoose.Types.ObjectId;
    percentage: number;
  }[];
  amount: number;
  description?: string;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

const CostAllocationSchema = new Schema<ICostAllocation>({
  sourceCostCenterId: { type: Schema.Types.ObjectId, ref: 'CostCenter', required: true },
  allocationRules: [{
    targetCostCenterId: { type: Schema.Types.ObjectId, ref: 'CostCenter', required: true },
    percentage: { type: Number, required: true, min: 0, max: 100 }
  }],
  amount: { type: Number, required: true },
  description: String,
  status: { type: String, enum: ['pending', 'completed', 'cancelled'], default: 'pending' }
}, { timestamps: true });

export const CostAllocation = mongoose.models.CostAllocation || mongoose.model<ICostAllocation>('CostAllocation', CostAllocationSchema);
