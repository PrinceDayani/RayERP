import mongoose, { Document, Schema } from 'mongoose';

export interface IActivityLog extends Document {
  timestamp: Date;
  user: mongoose.Types.ObjectId;
  userName: string;
  action: string;
  resource: string;
  resourceType: 'project' | 'task' | 'file' | 'comment' | 'employee' | 'budget' | 'other';
  resourceId?: mongoose.Types.ObjectId;
  projectId?: mongoose.Types.ObjectId;
  status: 'success' | 'error' | 'warning';
  details: string;
  metadata?: any;
  ipAddress: string;
  visibility: 'all' | 'management' | 'project_team' | 'private';
}

const ActivityLogSchema = new Schema<IActivityLog>({
  timestamp: {
    type: Date,
    default: Date.now,
    required: true
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: ['login', 'logout', 'create', 'update', 'delete', 'view', 'export', 'import', 'share', 'comment', 'assign', 'complete']
  },
  resource: {
    type: String,
    required: true
  },
  resourceType: {
    type: String,
    required: true,
    enum: ['project', 'task', 'file', 'comment', 'employee', 'budget', 'other'],
    default: 'other'
  },
  resourceId: {
    type: Schema.Types.ObjectId
  },
  projectId: {
    type: Schema.Types.ObjectId,
    ref: 'Project'
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
  metadata: {
    type: Schema.Types.Mixed
  },
  ipAddress: {
    type: String,
    required: true
  },
  visibility: {
    type: String,
    enum: ['all', 'management', 'project_team', 'private'],
    default: 'all'
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

export default mongoose.model<IActivityLog>('ActivityLog', ActivityLogSchema);