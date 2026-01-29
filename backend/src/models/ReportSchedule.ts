import mongoose, { Schema, Document } from 'mongoose';

export interface IReportSchedule extends Document {
  reportType: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  email: string;
  parameters: any;
  isActive: boolean;
  lastRun?: Date;
  nextRun: Date;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  name?: string;
  module?: string;
  format?: 'csv' | 'excel' | 'pdf';
  recipients?: string[];
  filters?: any;
}

const ReportScheduleSchema = new Schema({
  reportType: { type: String, required: true },
  frequency: { type: String, required: true, enum: ['daily', 'weekly', 'monthly', 'quarterly'] },
  email: { type: String, required: true },
  parameters: { type: Schema.Types.Mixed },
  isActive: { type: Boolean, default: true },
  lastRun: { type: Date },
  nextRun: { type: Date, required: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  name: { type: String },
  module: { type: String },
  format: { type: String, enum: ['csv', 'excel', 'pdf'], default: 'csv' },
  recipients: [{ type: String }],
  filters: { type: Schema.Types.Mixed }
});

export default mongoose.model<IReportSchedule>('ReportSchedule', ReportScheduleSchema);
