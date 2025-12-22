import mongoose, { Document, Schema } from 'mongoose';

export interface IChartOfAccount extends Document {
  code: string;
  name: string;
  type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
  subType: string;
  category: string;
  level: number;
  parentId?: mongoose.Types.ObjectId;
  groupId?: mongoose.Types.ObjectId;
  subGroupId?: mongoose.Types.ObjectId;
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
    gstNo?: string;
    panNo?: string;
    tdsApplicable?: boolean;
  };
  contactId?: mongoose.Types.ObjectId;
  contactInfo?: {
    phone?: string;
    email?: string;
    address?: string;
    city?: string;
    state?: string;
    primaryPhone?: string;
    primaryEmail?: string;
  };
  bankDetails?: {
    bankName?: string;
    accountNumber?: string;
    ifscCode?: string;
    branchName?: string;
  };
  createContact?: boolean;
  reconciliationStatus?: 'pending' | 'in_progress' | 'reconciled';
  lastReconciledDate?: Date;
  reconciledBalance?: number;
  enableInterest?: boolean;
  interestRate?: number;
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
  groupId: {
    type: Schema.Types.ObjectId,
    ref: 'AccountGroup'
  },
  subGroupId: {
    type: Schema.Types.ObjectId,
    ref: 'AccountSubGroup'
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
    sacCode: String,
    gstNo: String,
    panNo: String,
    tdsApplicable: Boolean
  },
  contactId: {
    type: Schema.Types.ObjectId,
    ref: 'Contact'
  },
  contactInfo: {
    phone: String,
    email: String,
    address: String,
    city: String,
    state: String,
    primaryPhone: String,
    primaryEmail: String
  },
  bankDetails: {
    bankName: String,
    accountNumber: String,
    ifscCode: String,
    branchName: String
  },
  createContact: {
    type: Boolean,
    default: false
  },
  reconciliationStatus: {
    type: String,
    enum: ['pending', 'in_progress', 'reconciled'],
    default: 'pending'
  },
  lastReconciledDate: {
    type: Date
  },
  reconciledBalance: {
    type: Number,
    default: 0
  },
  enableInterest: {
    type: Boolean,
    default: false
  },
  interestRate: {
    type: Number,
    default: 0
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