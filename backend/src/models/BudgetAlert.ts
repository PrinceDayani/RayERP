import mongoose, { Document, Schema } from 'mongoose';

export interface IBudgetAlert extends Document {
  budgetId: mongoose.Types.ObjectId;
  type: 'warning' | 'alert' | 'critical';
  threshold: number;
  currentUtilization: number;
  message: string;
  triggeredAt: Date;
  notifiedUsers: mongoose.Types.ObjectId[];
  acknowledged: boolean;
  acknowledgedBy?: mongoose.Types.ObjectId;
  acknowledgedAt?: Date;
  isActive: boolean;
  createdAt: Date;
}

const budgetAlertSchema = new Schema<IBudgetAlert>({
  budgetId: { type: Schema.Types.ObjectId, ref: 'Budget', required: true },
  type: { 
    type: String, 
    enum: ['warning', 'alert', 'critical'], 
    required: true 
  },
  threshold: { type: Number, required: true },
  currentUtilization: { type: Number, required: true },
  message: { type: String, required: true },
  triggeredAt: { type: Date, default: Date.now },
  notifiedUsers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  acknowledged: { type: Boolean, default: false },
  acknowledgedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  acknowledgedAt: Date,
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

budgetAlertSchema.index({ budgetId: 1, type: 1 });
budgetAlertSchema.index({ acknowledged: 1, isActive: 1 });
budgetAlertSchema.index({ triggeredAt: -1 });

export default mongoose.model<IBudgetAlert>('BudgetAlert', budgetAlertSchema);
