import mongoose, { Document, Schema } from 'mongoose';

export const LEAVE_TYPES = ['sick', 'vacation', 'personal', 'maternity', 'paternity', 'emergency'] as const;
export type LeaveType = typeof LEAVE_TYPES[number];

export interface ILeave extends Document {
  employee: mongoose.Types.ObjectId;
  leaveType: LeaveType;
  startDate: Date;
  endDate: Date;
  totalDays: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  appliedDate: Date;
  approvedBy?: mongoose.Types.ObjectId;
  approvedDate?: Date;
  rejectionReason?: string;
  cancelledBy?: mongoose.Types.ObjectId;
  cancelledDate?: Date;
  cancellationReason?: string;
  documents?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const leaveSchema = new Schema<ILeave>({
  employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  leaveType: { 
    type: String, 
    enum: LEAVE_TYPES, 
    required: true 
  },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  totalDays: { type: Number, required: true },
  reason: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected', 'cancelled'], 
    default: 'pending' 
  },
  appliedDate: { type: Date, default: Date.now },
  approvedBy: { type: Schema.Types.ObjectId, ref: 'Employee' },
  approvedDate: Date,
  rejectionReason: String,
  cancelledBy: { type: Schema.Types.ObjectId, ref: 'Employee' },
  cancelledDate: Date,
  cancellationReason: String,
  documents: [String]
}, { timestamps: true });

export default mongoose.model<ILeave>('Leave', leaveSchema);