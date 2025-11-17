import mongoose, { Document, Schema } from 'mongoose';

export interface IRecurringEntry extends Document {
  name: string;
  description?: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';
  cronExpression?: string;
  customSchedule?: string;
  startDate: Date;
  endDate?: Date;
  nextRunDate: Date;
  lastRunDate?: Date;
  lastRunStatus?: 'success' | 'failed' | 'skipped';
  failureReason?: string;
  retryCount?: number;
  maxRetries?: number;
  isActive: boolean;
  skipDates?: Date[];
  businessDaysOnly?: boolean;
  holidayCalendar?: string;
  fiscalYearAware?: boolean;
  entries: {
    accountId: mongoose.Types.ObjectId;
    debit: number | string;
    credit: number | string;
    description?: string;
    formula?: string;
    variables?: Record<string, any>;
  }[];
  approvalRequired?: boolean;
  approvalThreshold?: number;
  approvers?: mongoose.Types.ObjectId[];
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  autoApprove?: boolean;
  version?: number;
  versionHistory?: {
    version: number;
    changes: any;
    changedBy: mongoose.Types.ObjectId;
    changedAt: Date;
  }[];
  createdBy: mongoose.Types.ObjectId;
}

const RecurringEntrySchema = new Schema<IRecurringEntry>({
  name: { type: String, required: true },
  description: String,
  frequency: { type: String, enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom'], required: true },
  cronExpression: String,
  customSchedule: String,
  startDate: { type: Date, required: true },
  endDate: Date,
  nextRunDate: { type: Date, required: true },
  lastRunDate: Date,
  lastRunStatus: { type: String, enum: ['success', 'failed', 'skipped'] },
  failureReason: String,
  retryCount: { type: Number, default: 0 },
  maxRetries: { type: Number, default: 3 },
  isActive: { type: Boolean, default: true },
  skipDates: [Date],
  businessDaysOnly: { type: Boolean, default: false },
  holidayCalendar: String,
  fiscalYearAware: { type: Boolean, default: false },
  entries: [{
    accountId: { type: Schema.Types.ObjectId, ref: 'Account', required: true },
    debit: { type: Schema.Types.Mixed, default: 0 },
    credit: { type: Schema.Types.Mixed, default: 0 },
    description: String,
    formula: String,
    variables: Schema.Types.Mixed
  }],
  approvalRequired: { type: Boolean, default: false },
  approvalThreshold: Number,
  approvers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  approvalStatus: { type: String, enum: ['pending', 'approved', 'rejected'] },
  autoApprove: { type: Boolean, default: false },
  version: { type: Number, default: 1 },
  versionHistory: [{
    version: Number,
    changes: Schema.Types.Mixed,
    changedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    changedAt: Date
  }],
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

export const RecurringEntry = mongoose.model<IRecurringEntry>('RecurringEntry', RecurringEntrySchema);
