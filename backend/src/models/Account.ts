import mongoose, { Document, Schema } from 'mongoose';

export interface IAccount extends Document {
  code: string;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  subType: string;
  category: string;
  level: number;
  projectId?: mongoose.Types.ObjectId;
  balance: number;
  isActive: boolean;
  isGroup: boolean;
  description?: string;
  createdBy?: mongoose.Types.ObjectId;
  openingBalance: number;
  currency: string;
  parentId?: mongoose.Types.ObjectId;
  subGroupId?: mongoose.Types.ObjectId;
  enableBillTracking?: boolean;
  enableInterest?: boolean;
  interestRate?: number;
  budgetAmount?: number;
  allowPosting?: boolean;
  restrictionReason?: string;
  reconciliationStatus?: 'pending' | 'in_progress' | 'reconciled';
  lastReconciledDate?: Date;
  reconciledBalance?: number;
  metadata?: Record<string, any>;
  taxInfo?: {
    gstNo?: string;
    panNo?: string;
    aadharNo?: string;
    tanNo?: string;
    cinNo?: string;
    taxRate?: number;
  };
  contactInfo?: {
    primaryEmail?: string;
    secondaryEmail?: string;
    primaryPhone?: string;
    secondaryPhone?: string;
    mobile?: string;
    fax?: string;
    website?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    pincode?: string;
  };
  bankDetails?: {
    accountNumber?: string;
    ifscCode?: string;
    bankName?: string;
    branch?: string;
  };
  creditLimit?: number;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const AccountSchema = new Schema<IAccount>({
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
    enum: ['asset', 'liability', 'equity', 'revenue', 'expense']
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
    default: 'INR',
    trim: true
  },
  parentId: {
    type: Schema.Types.ObjectId,
    ref: 'Account'
  },
  subGroupId: {
    type: Schema.Types.ObjectId,
    ref: 'AccountSubGroup'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isGroup: {
    type: Boolean,
    default: false
  },
  description: {
    type: String,
    trim: true
  },
  projectId: {
    type: Schema.Types.ObjectId,
    ref: 'Project'
  },
  taxInfo: {
    gstNo: String,
    panNo: String,
    aadharNo: String,
    tanNo: String,
    cinNo: String,
    taxRate: Number
  },
  contactInfo: {
    primaryEmail: String,
    secondaryEmail: String,
    primaryPhone: String,
    secondaryPhone: String,
    mobile: String,
    fax: String,
    website: String,
    address: String,
    city: String,
    state: String,
    country: String,
    pincode: String
  },
  bankDetails: {
    accountNumber: String,
    ifscCode: String,
    bankName: String,
    branch: String
  },
  creditLimit: {
    type: Number,
    default: 0
  },
  tags: [String],
  enableBillTracking: {
    type: Boolean,
    default: false
  },
  enableInterest: {
    type: Boolean,
    default: false
  },
  interestRate: {
    type: Number,
    default: 0,
    min: 0
  },
  budgetAmount: {
    type: Number,
    default: 0
  },
  allowPosting: {
    type: Boolean,
    default: true
  },
  restrictionReason: {
    type: String,
    trim: true
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
  metadata: {
    type: Schema.Types.Mixed
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false
  }
}, {
  timestamps: true
});

AccountSchema.index({ code: 1 });
AccountSchema.index({ type: 1 });
AccountSchema.index({ isActive: 1 });
AccountSchema.index({ subGroupId: 1 });
AccountSchema.index({ type: 1, isActive: 1 });

const Account = mongoose.model<IAccount>('Account', AccountSchema);
export { Account };
export default Account;
