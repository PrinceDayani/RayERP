import mongoose, { Schema, Document } from 'mongoose';

export interface IBudgetActivity extends Document {
  budget: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  action: 'created' | 'updated' | 'deleted' | 'approved' | 'rejected' | 'transferred' | 'commented' | 'mentioned' | 'revised';
  description: string;
  metadata?: any;
  createdAt: Date;
}

const BudgetActivitySchema = new Schema<IBudgetActivity>({
  budget: { type: Schema.Types.ObjectId, ref: 'Budget', required: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  action: { 
    type: String, 
    enum: ['created', 'updated', 'deleted', 'approved', 'rejected', 'transferred', 'commented', 'mentioned', 'revised'],
    required: true 
  },
  description: { type: String, required: true },
  metadata: Schema.Types.Mixed
}, { timestamps: true });

BudgetActivitySchema.index({ budget: 1, createdAt: -1 });
BudgetActivitySchema.index({ user: 1, createdAt: -1 });
BudgetActivitySchema.index({ action: 1, createdAt: -1 });

export default mongoose.model<IBudgetActivity>('BudgetActivity', BudgetActivitySchema);
