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
  deviceFingerprint?: string;
  browserDetails?: {
    name?: string;
    version?: string;
    os?: string;
    platform?: string;
  };
  geolocation?: {
    country?: string;
    city?: string;
    region?: string;
    timezone?: string;
  };
  referrerUrl?: string;
  reversible?: boolean;
  reverted?: boolean;
  revertedBy?: mongoose.Types.ObjectId;
  revertedAt?: Date;
  hash?: string;
  previousHash?: string;
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
  },
  deviceFingerprint: {
    type: String,
    index: true
  },
  browserDetails: {
    name: String,
    version: String,
    os: String,
    platform: String
  },
  geolocation: {
    country: String,
    city: String,
    region: String,
    timezone: String
  },
  referrerUrl: {
    type: String
  },
  reversible: {
    type: Boolean,
    default: false
  },
  reverted: {
    type: Boolean,
    default: false
  },
  revertedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  revertedAt: {
    type: Date
  },
  hash: {
    type: String,
    index: true
  },
  previousHash: {
    type: String
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

// Compound indexes for optimized queries
ActivityLogSchema.index({ visibility: 1, timestamp: -1 });
ActivityLogSchema.index({ user: 1, timestamp: -1 });
ActivityLogSchema.index({ projectId: 1, timestamp: -1 });
ActivityLogSchema.index({ resourceType: 1, timestamp: -1 });
ActivityLogSchema.index({ status: 1, timestamp: -1 });
ActivityLogSchema.index({ ipAddress: 1, timestamp: -1 });
ActivityLogSchema.index({ sessionId: 1, timestamp: -1 });

// Text index for full-text search across all searchable fields
ActivityLogSchema.index({
  userName: 'text',
  action: 'text',
  resource: 'text',
  details: 'text',
  description: 'text',
  projectName: 'text',
  ipAddress: 'text',
  userAgent: 'text',
  endpoint: 'text'
}, {
  name: 'activity_text_search',
  weights: {
    userName: 10,
    action: 8,
    resource: 8,
    details: 5,
    projectName: 7,
    description: 5,
    ipAddress: 3,
    userAgent: 2,
    endpoint: 2
  }
});

// TTL index: Auto-delete records older than 90 days
ActivityLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 }); // 90 days

export default mongoose.model<IActivityLog>('ActivityLog', ActivityLogSchema);