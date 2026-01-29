import mongoose, { Document, Schema } from 'mongoose';

export interface IActivityLog extends Document {
  timestamp: Date;
  user: mongoose.Types.ObjectId;
  userName: string;
  action: string;
  resource: string;
  resourceType: 'project' | 'task' | 'file' | 'comment' | 'employee' | 'budget' | 'user' | 'role' | 'department' | 'report' | 'notification' | 'system' | 'auth' | 'other';
  resourceId?: mongoose.Types.ObjectId;
  projectId?: mongoose.Types.ObjectId;
  projectName?: string;
  status: 'success' | 'error' | 'warning';
  details: string;
  description?: string;
  type?: string;
  metadata?: any;
  ipAddress: string;
  visibility: 'all' | 'management' | 'project_team' | 'private';
  category?: 'system' | 'user' | 'project' | 'security' | 'data';
  severity?: 'low' | 'medium' | 'high' | 'critical';
  requestId?: string;
  duration?: number;
  errorStack?: string;
  userAgent?: string;
  sessionId?: string;
  httpMethod?: string;
  endpoint?: string;
  changes?: { before?: any; after?: any };
}

const ActivityLogSchema = new Schema<IActivityLog>({
  timestamp: {
    type: Date,
    default: Date.now,
    required: true
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  userName: {
    type: String,
    default: 'System'
  },
  action: {
    type: String,
    required: true
  },
  resource: {
    type: String
  },
  resourceType: {
    type: String,
    enum: ['project', 'task', 'file', 'comment', 'employee', 'budget', 'user', 'role', 'department', 'report', 'notification', 'system', 'auth', 'other'],
    default: 'other'
  },
  resourceId: {
    type: Schema.Types.ObjectId
  },
  projectId: {
    type: Schema.Types.ObjectId,
    ref: 'Project'
  },
  projectName: {
    type: String
  },
  status: {
    type: String,
    required: true,
    enum: ['success', 'error', 'warning'],
    default: 'success'
  },
  details: {
    type: String
  },
  description: {
    type: String
  },
  type: {
    type: String
  },
  metadata: {
    type: Schema.Types.Mixed
  },
  ipAddress: {
    type: String
  },
  visibility: {
    type: String,
    enum: ['all', 'management', 'project_team', 'private'],
    default: 'all'
  },
  category: {
    type: String,
    enum: ['system', 'user', 'project', 'security', 'data'],
    default: 'user'
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'low'
  },
  requestId: {
    type: String,
    index: true
  },
  duration: {
    type: Number
  },
  errorStack: {
    type: String
  },
  userAgent: {
    type: String
  },
  sessionId: {
    type: String,
    index: true
  },
  httpMethod: {
    type: String
  },
  endpoint: {
    type: String
  },
  changes: {
    before: Schema.Types.Mixed,
    after: Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Index for better query performance
ActivityLogSchema.index({ timestamp: -1 });
ActivityLogSchema.index({ user: 1 });
ActivityLogSchema.index({ action: 1 });
ActivityLogSchema.index({ status: 1 });
ActivityLogSchema.index({ projectId: 1 });
ActivityLogSchema.index({ resourceType: 1 });
ActivityLogSchema.index({ visibility: 1 });
ActivityLogSchema.index({ requestId: 1 });
ActivityLogSchema.index({ sessionId: 1 });
ActivityLogSchema.index({ projectName: 1 });

export default mongoose.model<IActivityLog>('ActivityLog', ActivityLogSchema);