import mongoose, { Schema, Document } from 'mongoose';

export interface ISmartAlert extends Document {
  type: 'DUPLICATE' | 'FRAUD' | 'ANOMALY' | 'THRESHOLD';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  entityType: string;
  entityId: mongoose.Types.ObjectId;
  isResolved: boolean;
  resolvedBy?: mongoose.Types.ObjectId;
  resolvedAt?: Date;
}

const SmartAlertSchema = new Schema({
  type: { type: String, enum: ['DUPLICATE', 'FRAUD', 'ANOMALY', 'THRESHOLD'], required: true },
  severity: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], required: true },
  message: { type: String, required: true },
  entityType: { type: String, required: true },
  entityId: { type: Schema.Types.ObjectId, required: true },
  isResolved: { type: Boolean, default: false },
  resolvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  resolvedAt: Date
}, { timestamps: true });

export default mongoose.model<ISmartAlert>('SmartAlert', SmartAlertSchema);
