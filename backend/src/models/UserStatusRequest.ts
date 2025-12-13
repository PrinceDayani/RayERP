import mongoose, { Document, Schema } from 'mongoose';

export interface IUserStatusRequest extends Document {
  user: mongoose.Types.ObjectId;
  requestedBy: mongoose.Types.ObjectId;
  currentStatus: string;
  requestedStatus: string;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const userStatusRequestSchema = new Schema<IUserStatusRequest>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    requestedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    currentStatus: {
      type: String,
      enum: ['active', 'inactive', 'disabled', 'pending_approval'],
      required: true
    },
    requestedStatus: {
      type: String,
      enum: ['active', 'inactive', 'disabled', 'pending_approval'],
      required: true
    },
    reason: {
      type: String
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedAt: {
      type: Date
    },
    rejectionReason: {
      type: String
    }
  },
  { timestamps: true }
);

const UserStatusRequest = mongoose.model<IUserStatusRequest>('UserStatusRequest', userStatusRequestSchema);

export default UserStatusRequest;
