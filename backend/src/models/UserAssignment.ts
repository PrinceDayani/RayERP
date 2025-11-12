import mongoose, { Schema, Document } from 'mongoose';

export interface IUserAssignment extends Document {
  userId: mongoose.Types.ObjectId;
  resourceType: 'project' | 'task' | 'budget' | 'report' | 'document';
  resourceId: mongoose.Types.ObjectId;
  permissions: string[];
  assignedBy: mongoose.Types.ObjectId;
  assignedAt: Date;
  expiresAt?: Date;
  isActive: boolean;
}

const UserAssignmentSchema = new Schema<IUserAssignment>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  resourceType: {
    type: String,
    enum: ['project', 'task', 'budget', 'report', 'document'],
    required: true
  },
  resourceId: {
    type: Schema.Types.ObjectId,
    required: true
  },
  permissions: [{
    type: String,
    required: true
  }],
  assignedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
UserAssignmentSchema.index({ userId: 1, resourceType: 1, resourceId: 1 });
UserAssignmentSchema.index({ userId: 1, isActive: 1 });

export default mongoose.model<IUserAssignment>('UserAssignment', UserAssignmentSchema);