import mongoose, { Document, Schema } from 'mongoose';

export interface IAttendance extends Document {
  employee: mongoose.Types.ObjectId;
  date: Date;
  checkIn: Date;
  checkOut?: Date;
  breakTime: number;
  totalHours: number;
  status: 'present' | 'absent' | 'late' | 'half-day';
  notes?: string;
  // Approval system
  isManualEntry: boolean;
  approvalStatus: 'pending' | 'approved' | 'rejected' | 'auto-approved';
  requestedBy?: mongoose.Types.ObjectId;
  approvedBy?: mongoose.Types.ObjectId;
  approvedDate?: Date;
  rejectionReason?: string;
  // Card system integration
  cardEntryTime?: Date;
  cardExitTime?: Date;
  cardId?: string;
  entrySource: 'manual' | 'card' | 'system';
  createdAt: Date;
  updatedAt: Date;
}

const attendanceSchema = new Schema<IAttendance>({
  employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  date: { type: Date, required: true },
  checkIn: { type: Date, required: true },
  checkOut: Date,
  breakTime: { type: Number, default: 0 },
  totalHours: { type: Number, default: 0 },
  status: { 
    type: String, 
    enum: ['present', 'absent', 'late', 'half-day'], 
    default: 'present' 
  },
  notes: String,
  // Approval system
  isManualEntry: { type: Boolean, default: false },
  approvalStatus: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected', 'auto-approved'], 
    default: 'auto-approved' 
  },
  requestedBy: { type: Schema.Types.ObjectId, ref: 'Employee' },
  approvedBy: { type: Schema.Types.ObjectId, ref: 'Employee' },
  approvedDate: Date,
  rejectionReason: String,
  // Card system integration
  cardEntryTime: Date,
  cardExitTime: Date,
  cardId: String,
  entrySource: { 
    type: String, 
    enum: ['manual', 'card', 'system'], 
    default: 'manual' 
  }
}, { timestamps: true });

attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

export default mongoose.model<IAttendance>('Attendance', attendanceSchema);