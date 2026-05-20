import mongoose, { Document, Schema } from 'mongoose';

export interface IRequiredReporter {
  employee: mongoose.Types.ObjectId;
  role: 'team-member' | 'supervisor' | 'manager';
}

export interface IReportingSchedule extends Document {
  project: mongoose.Types.ObjectId;
  frequency: 'daily' | 'weekly' | 'bi-weekly' | 'monthly';
  dueTime: string; // "18:00" format
  dueDay?: number; // 0=Sunday, 1=Monday... for weekly/bi-weekly
  dueDateOfMonth?: number; // 1-28 for monthly
  requiredFrom: IRequiredReporter[];
  reminderEnabled: boolean;
  reminderBeforeMinutes: number;
  escalateOnMiss: boolean;
  escalateTo?: mongoose.Types.ObjectId;
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const requiredReporterSchema = new Schema({
  employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  role: {
    type: String,
    enum: ['team-member', 'supervisor', 'manager'],
    default: 'team-member'
  }
}, { _id: false });

const reportingScheduleSchema = new Schema<IReportingSchedule>({
  project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  frequency: {
    type: String,
    enum: ['daily', 'weekly', 'bi-weekly', 'monthly'],
    default: 'daily'
  },
  dueTime: { type: String, default: '18:00' },
  dueDay: { type: Number, min: 0, max: 6 },
  dueDateOfMonth: { type: Number, min: 1, max: 28 },
  requiredFrom: [requiredReporterSchema],
  reminderEnabled: { type: Boolean, default: true },
  reminderBeforeMinutes: { type: Number, default: 60 },
  escalateOnMiss: { type: Boolean, default: false },
  escalateTo: { type: Schema.Types.ObjectId, ref: 'Employee' },
  isActive: { type: Boolean, default: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

// One schedule per project
reportingScheduleSchema.index({ project: 1 }, { unique: true });
reportingScheduleSchema.index({ isActive: 1 });

export default mongoose.model<IReportingSchedule>('ReportingSchedule', reportingScheduleSchema);
