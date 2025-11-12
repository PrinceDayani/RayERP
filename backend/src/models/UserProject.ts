import mongoose, { Document, Schema } from 'mongoose';

export interface IUserProject extends Document {
  userId: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  accessLevel: 'read' | 'write' | 'admin';
  assignedBy: mongoose.Types.ObjectId;
  assignedAt: Date;
  isActive: boolean;
}

const userProjectSchema = new Schema<IUserProject>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  projectId: {
    type: Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  accessLevel: {
    type: String,
    enum: ['read', 'write', 'admin'],
    default: 'read'
  },
  assignedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate assignments
userProjectSchema.index({ userId: 1, projectId: 1 }, { unique: true });

export const UserProject = mongoose.model<IUserProject>('UserProject', userProjectSchema);