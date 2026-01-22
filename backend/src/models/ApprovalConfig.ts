import mongoose, { Document, Schema } from 'mongoose';

export interface IApprovalConfig extends Document {
  entityType: string;
  levels: {
    level: number;
    approverRole: string;
    amountThreshold: number;
  }[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const approvalConfigSchema = new Schema<IApprovalConfig>({
  entityType: { type: String, required: true, unique: true },
  levels: [{
    level: { type: Number, required: true },
    approverRole: { type: String, required: true },
    amountThreshold: { type: Number, required: true }
  }],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model<IApprovalConfig>('ApprovalConfig', approvalConfigSchema);
