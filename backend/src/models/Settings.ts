import mongoose, { Document, Schema } from 'mongoose';

export interface ICurrencyConfig {
  code: string;
  symbol: string;
  name: string;
  decimalPlaces: number;
  thousandsSeparator: string;
  decimalSeparator: string;
  symbolPosition: 'before' | 'after';
}

export interface IProjectSettings {
  defaultView: 'grid' | 'list' | 'kanban';
  autoAssignDepartments: boolean;
  requireApprovalForStatusChange: boolean;
  enableTaskDragDrop: boolean;
  defaultTaskColumns: string[];
  fileSharePermissions: 'project-members' | 'department-members' | 'all-users';
}

export interface ISettings extends Document {
  accountingMode: 'western' | 'indian';
  companyName: string;
  fiscalYearStart: string;
  currency: string;
  currencyConfig: ICurrencyConfig;
  projectSettings: IProjectSettings;
  createdAt: Date;
  updatedAt: Date;
}

const currencyConfigSchema = new Schema({
  code: { type: String, required: true },
  symbol: { type: String, required: true },
  name: { type: String, required: true },
  decimalPlaces: { type: Number, default: 2 },
  thousandsSeparator: { type: String, default: ',' },
  decimalSeparator: { type: String, default: '.' },
  symbolPosition: { type: String, enum: ['before', 'after'], default: 'before' }
}, { _id: false });

const projectSettingsSchema = new Schema({
  defaultView: { type: String, enum: ['grid', 'list', 'kanban'], default: 'grid' },
  autoAssignDepartments: { type: Boolean, default: false },
  requireApprovalForStatusChange: { type: Boolean, default: false },
  enableTaskDragDrop: { type: Boolean, default: true },
  defaultTaskColumns: { type: [String], default: ['todo', 'in-progress', 'review', 'completed'] },
  fileSharePermissions: { type: String, enum: ['project-members', 'department-members', 'all-users'], default: 'project-members' }
}, { _id: false });

const SettingsSchema = new Schema<ISettings>({
  accountingMode: {
    type: String,
    enum: ['western', 'indian'],
    default: 'western'
  },
  companyName: { type: String, default: 'My Company' },
  fiscalYearStart: { type: String, default: '01-01' },
  currency: { type: String, default: 'USD' },
  currencyConfig: {
    type: currencyConfigSchema,
    default: {
      code: 'USD',
      symbol: '$',
      name: 'US Dollar',
      decimalPlaces: 2,
      thousandsSeparator: ',',
      decimalSeparator: '.',
      symbolPosition: 'before'
    }
  },
  projectSettings: {
    type: projectSettingsSchema,
    default: {
      defaultView: 'grid',
      autoAssignDepartments: false,
      requireApprovalForStatusChange: false,
      enableTaskDragDrop: true,
      defaultTaskColumns: ['todo', 'in-progress', 'review', 'completed'],
      fileSharePermissions: 'project-members'
    }
  }
}, { timestamps: true });

export const Settings = mongoose.model<ISettings>('Settings', SettingsSchema);
