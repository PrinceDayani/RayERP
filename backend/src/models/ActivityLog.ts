import mongoose, { Document, Schema } from 'mongoose';

export interface IActivityLog extends Document {
  timestamp: Date;
  user: string;
  action: string;
  resource: string;
  status: 'success' | 'error' | 'warning';
  details: string;
  ipAddress: string;
}

const ActivityLogSchema = new Schema<IActivityLog>({
  timestamp: {
    type: Date,
    default: Date.now,
    required: true
  },
  user: {
    type: String,
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: ['login', 'logout', 'create', 'update', 'delete', 'view', 'export', 'import']
  },
  resource: {
    type: String,
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: ['success', 'error', 'warning'],
    default: 'success'
  },
  details: {
    type: String,
    required: true
  },
  ipAddress: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Index for better query performance
ActivityLogSchema.index({ timestamp: -1 });
ActivityLogSchema.index({ user: 1 });
ActivityLogSchema.index({ action: 1 });
ActivityLogSchema.index({ status: 1 });

export default mongoose.model<IActivityLog>('ActivityLog', ActivityLogSchema);