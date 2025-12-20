import mongoose, { Schema, Document } from 'mongoose';

export interface IApprovalLevel {
  level: number;
  approverRole: string;
  approverIds: mongoose.Types.ObjectId[];
  amountThreshold: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SKIPPED';
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  comments?: string;
}

export interface IApprovalRequest extends Document {
  entityType: 'JOURNAL' | 'PAYMENT' | 'INVOICE' | 'EXPENSE' | 'VOUCHER';
  entityId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  amount: number;
  requestedBy: mongoose.Types.ObjectId;
  requestedAt: Date;
  currentLevel: number;
  totalLevels: number;
  approvalLevels: IApprovalLevel[];
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  metadata: any;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const approvalLevelSchema = new Schema<IApprovalLevel>({
  level: { type: Number, required: true },
  approverRole: { type: String, required: true },
  approverIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  amountThreshold: { type: Number, default: 0 },
  status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED', 'SKIPPED'], default: 'PENDING' },
  approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  approvedAt: Date,
  comments: String
});

const approvalRequestSchema = new Schema<IApprovalRequest>({
  entityType: { type: String, enum: ['JOURNAL', 'PAYMENT', 'INVOICE', 'EXPENSE', 'VOUCHER'], required: true },
  entityId: { type: Schema.Types.ObjectId, required: true },
  title: { type: String, required: true },
  description: String,
  amount: { type: Number, required: true },
  requestedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  requestedAt: { type: Date, default: Date.now },
  currentLevel: { type: Number, default: 1 },
  totalLevels: { type: Number, required: true },
  approvalLevels: [approvalLevelSchema],
  status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'], default: 'PENDING' },
  priority: { type: String, enum: ['HIGH', 'MEDIUM', 'LOW'], default: 'MEDIUM' },
  metadata: Schema.Types.Mixed,
  completedAt: Date
}, { timestamps: true });

approvalRequestSchema.index({ entityType: 1, entityId: 1 });
approvalRequestSchema.index({ status: 1, currentLevel: 1 });
approvalRequestSchema.index({ requestedBy: 1, status: 1 });
approvalRequestSchema.index({ 'approvalLevels.approverIds': 1, status: 1 });

export default mongoose.model<IApprovalRequest>('ApprovalRequest', approvalRequestSchema);
