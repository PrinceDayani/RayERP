import mongoose, { Schema, Document } from 'mongoose';

export interface IApprovalWorkflow extends Document {
  entryId: mongoose.Types.ObjectId;
  entryType: 'JOURNAL' | 'VOUCHER' | 'PAYMENT';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvers: { userId: mongoose.Types.ObjectId; level: number; status: string; approvedAt?: Date }[];
  requestedBy: mongoose.Types.ObjectId;
  requestedAt: Date;
}

const ApprovalWorkflowSchema = new Schema({
  entryId: { type: Schema.Types.ObjectId, required: true },
  entryType: { type: String, enum: ['JOURNAL', 'VOUCHER', 'PAYMENT'], required: true },
  status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' },
  approvers: [{
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    level: Number,
    status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' },
    approvedAt: Date
  }],
  requestedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  requestedAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model<IApprovalWorkflow>('ApprovalWorkflow', ApprovalWorkflowSchema);
