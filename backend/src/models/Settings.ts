import mongoose, { Document, Schema } from 'mongoose';

export interface ISettings extends Document {
  accountingMode: 'western' | 'indian';
  companyName: string;
  fiscalYearStart: string;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

const SettingsSchema = new Schema<ISettings>({
  accountingMode: {
    type: String,
    enum: ['western', 'indian'],
    default: 'western'
  },
  companyName: { type: String, default: 'My Company' },
  fiscalYearStart: { type: String, default: '01-01' },
  currency: { type: String, default: 'USD' }
}, { timestamps: true });

export const Settings = mongoose.model<ISettings>('Settings', SettingsSchema);
