import mongoose, { Document, Schema } from 'mongoose';

export interface IChartOfAccount extends Document {
  code: string;
  name: string;
  type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
  subType: string;
  category: string;
  level: number;
  parentId?: mongoose.Types.ObjectId;
  balance: number;
  openingBalance: number;
  currency: string;
  isActive: boolean;
  isGroup: boolean;
  allowPosting: boolean;
  description?: string;
  taxInfo?: {
    gstRate?: number;
    hsnCode?: string;
    sacCode?: string;
  };
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ChartOfAccountSchema = new Schema<IChartOfAccount>({
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
    enum: ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE']
  },
  subType: {
    type: String,
    trim: true,
    default: ''
  },
  category: {
    type: String,
    trim: true,
    default: ''
  },
  level: {
    type: Number,
    default: 0
  },
  parentId: {
    type: Schema.Types.ObjectId,
    ref: 'ChartOfAccount'
  },
  balance: {
    type: Number,
    default: 0
  },
  openingBalance: {
    type: Number,
    default: 0
  },
  currency: {
    type: String,
    default: 'INR'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isGroup: {
    type: Boolean,
    default: false
  },
  allowPosting: {
    type: Boolean,
    default: true
  },
  description: {
    type: String,
    trim: true
  },
  taxInfo: {
    gstRate: Number,
    hsnCode: String,
    sacCode: String
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

ChartOfAccountSchema.index({ code: 1 });
ChartOfAccountSchema.index({ type: 1, isActive: 1 });
ChartOfAccountSchema.index({ parentId: 1 });

export default mongoose.model<IChartOfAccount>('ChartOfAccount', ChartOfAccountSchema);