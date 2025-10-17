import mongoose, { Document, Schema } from 'mongoose';

export interface IChartOfAccounts extends Document {
  code: string;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'income' | 'expense';
  subType: string;
  parentId?: mongoose.Types.ObjectId;
  level: number;
  isActive: boolean;
  isControlAccount: boolean;
  openingBalance: number;
  balance: number;
  currency: string;
  taxConfiguration: {
    gstRate?: number;
    tdsRate?: number;
    vatRate?: number;
  };
  projectCodes: string[];
  costCenterIds: mongoose.Types.ObjectId[];
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ChartOfAccountsSchema = new Schema<IChartOfAccounts>({
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['asset', 'liability', 'equity', 'income', 'expense']
  },
  subType: {
    type: String,
    required: true,
    trim: true
  },
  parentId: {
    type: Schema.Types.ObjectId,
    ref: 'ChartOfAccounts'
  },
  level: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isControlAccount: {
    type: Boolean,
    default: false
  },
  openingBalance: {
    type: Number,
    default: 0
  },
  balance: {
    type: Number,
    default: 0
  },
  currency: {
    type: String,
    default: 'INR'
  },
  taxConfiguration: {
    gstRate: { type: Number, min: 0, max: 100 },
    tdsRate: { type: Number, min: 0, max: 100 },
    vatRate: { type: Number, min: 0, max: 100 }
  },
  projectCodes: [{
    type: String,
    trim: true
  }],
  costCenterIds: [{
    type: Schema.Types.ObjectId,
    ref: 'CostCenter'
  }],
  description: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

ChartOfAccountsSchema.index({ code: 1 });
ChartOfAccountsSchema.index({ type: 1, isActive: 1 });
ChartOfAccountsSchema.index({ parentId: 1 });
ChartOfAccountsSchema.index({ projectCodes: 1 });

export const ChartOfAccounts = mongoose.model<IChartOfAccounts>('ChartOfAccounts', ChartOfAccountsSchema);