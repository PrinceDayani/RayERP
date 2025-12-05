import mongoose, { Schema, Document } from 'mongoose';

export interface IBudgetTransfer extends Document {
  transferNumber: string;
  fromBudget: mongoose.Types.ObjectId;
  toBudget: mongoose.Types.ObjectId;
  amount: number;
  reason: string;
  requestedBy: mongoose.Types.ObjectId;
  approvedBy?: mongoose.Types.ObjectId;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  approvalDate?: Date;
  completionDate?: Date;
  rejectionReason?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BudgetTransferSchema = new Schema<IBudgetTransfer>({
  transferNumber: { type: String, required: true, unique: true },
  fromBudget: { type: Schema.Types.ObjectId, ref: 'Budget', required: true },
  toBudget: { type: Schema.Types.ObjectId, ref: 'Budget', required: true },
  amount: { type: Number, required: true, min: 0 },
  reason: { type: String, required: true },
  requestedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected', 'completed'],
    default: 'pending'
  },
  approvalDate: Date,
  completionDate: Date,
  rejectionReason: String,
  notes: String
}, { timestamps: true });

BudgetTransferSchema.index({ transferNumber: 1 });
BudgetTransferSchema.index({ fromBudget: 1, status: 1 });
BudgetTransferSchema.index({ toBudget: 1, status: 1 });
BudgetTransferSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model<IBudgetTransfer>('BudgetTransfer', BudgetTransferSchema);
