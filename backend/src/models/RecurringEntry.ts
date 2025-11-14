import mongoose, { Document, Schema } from 'mongoose';

export interface IRecurringEntry extends Document {
  name: string;
  description?: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  startDate: Date;
  endDate?: Date;
  nextRunDate: Date;
  lastRunDate?: Date;
  isActive: boolean;
  entries: {
    accountId: mongoose.Types.ObjectId;
    debit: number;
    credit: number;
    description?: string;
  }[];
  createdBy: mongoose.Types.ObjectId;
}

const RecurringEntrySchema = new Schema<IRecurringEntry>({
  name: { type: String, required: true },
  description: String,
  frequency: { type: String, enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'], required: true },
  startDate: { type: Date, required: true },
  endDate: Date,
  nextRunDate: { type: Date, required: true },
  lastRunDate: Date,
  isActive: { type: Boolean, default: true },
  entries: [{
    accountId: { type: Schema.Types.ObjectId, ref: 'Account', required: true },
    debit: { type: Number, default: 0 },
    credit: { type: Number, default: 0 },
    description: String
  }],
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

export const RecurringEntry = mongoose.model<IRecurringEntry>('RecurringEntry', RecurringEntrySchema);
