import mongoose, { Schema, Document } from 'mongoose';

export interface IReportSchedule extends Document {
  reportType: 'balance-sheet' | 'profit-loss' | 'cash-flow';
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  email: string;
  parameters: any;
  isActive: boolean;
  lastRun?: Date;
  nextRun: Date;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const ReportScheduleSchema = new Schema({
  reportType: { type: String, required: true, enum: ['balance-sheet', 'profit-loss', 'cash-flow'] },
  frequency: { type: String, required: true, enum: ['daily', 'weekly', 'monthly', 'quarterly'] },
  email: { type: String, required: true },
  parameters: { type: Schema.Types.Mixed },
  isActive: { type: Boolean, default: true },
  lastRun: { type: Date },
  nextRun: { type: Date, required: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IReportSchedule>('ReportSchedule', ReportScheduleSchema);
