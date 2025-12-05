import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
  timestamp: Date;
  userId: mongoose.Types.ObjectId;
  userEmail: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW' | 'LOGIN' | 'LOGOUT';
  module: string;
  recordId?: string;
  oldValue?: string;
  newValue?: string;
  ipAddress: string;
  userAgent: string;
  status: 'Success' | 'Failed' | 'Warning';
  sessionId?: string;
  requestId?: string;
  additionalData?: any;
}

const AuditLogSchema = new Schema<IAuditLog>({
  timestamp: { type: Date, default: Date.now, required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  userEmail: { type: String, required: true },
  action: { type: String, enum: ['CREATE', 'UPDATE', 'DELETE', 'VIEW', 'LOGIN', 'LOGOUT'], required: true },
  module: { type: String, required: true },
  recordId: String,
  oldValue: String,
  newValue: String,
  ipAddress: { type: String, required: true },
  userAgent: { type: String, required: true },
  status: { type: String, enum: ['Success', 'Failed', 'Warning'], default: 'Success' },
  sessionId: String,
  requestId: String,
  additionalData: Schema.Types.Mixed
}, { timestamps: true });

AuditLogSchema.index({ timestamp: -1 });
AuditLogSchema.index({ userId: 1, timestamp: -1 });
AuditLogSchema.index({ module: 1, action: 1 });
AuditLogSchema.index({ status: 1 });
AuditLogSchema.index({ status: 1, timestamp: -1 });
AuditLogSchema.index({ userEmail: 1, timestamp: -1 });
AuditLogSchema.index({ ipAddress: 1 });
// TTL index for automatic cleanup after 7 years (2555 days)
AuditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 220752000 });

export default mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
