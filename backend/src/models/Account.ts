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
  notes?: string;
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
    tdsApplicable?: boolean;
    tdsRate?: number;
    tdsSection?: string;
    tdsCategory?: 'individual' | 'company' | 'firm' | 'other';
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
    accountType?: 'savings' | 'current' | 'cc' | 'od';
    swiftCode?: string;
  };
  creditLimit?: number;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
  isUniversal?: boolean;
  companyId?: mongoose.Types.ObjectId;
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
  accountNature: {
    type: String,
    enum: ['debit', 'credit'],
    default: function() {
      return ['asset', 'expense'].includes(this.type) ? 'debit' : 'credit';
    }
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
  notes: {
    type: String,
    trim: true
  },
  projectId: {
    type: Schema.Types.ObjectId,
    ref: 'Project'
  },
  taxInfo: {
    gstNo: { type: String, trim: true, uppercase: true },
    panNo: { 
      type: String, 
      trim: true, 
      uppercase: true, 
      validate: {
        validator: function(v: string) {
          return !v || /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(v);
        },
        message: 'Invalid PAN format'
      }
    },
    aadharNo: String,
    tanNo: { type: String, trim: true, uppercase: true },
    cinNo: { type: String, trim: true, uppercase: true },
    taxRate: { type: Number, default: 0, min: 0, max: 100 },
    tdsApplicable: { type: Boolean, default: false },
    tdsRate: { type: Number, default: 0, min: 0, max: 100 },
    tdsSection: { type: String, trim: true },
    tdsCategory: {
      type: String,
      enum: ['individual', 'company', 'firm', 'other'],
      default: 'individual'
    }
  },
  contactInfo: {
    primaryEmail: { type: String, trim: true, lowercase: true },
    secondaryEmail: { type: String, trim: true, lowercase: true },
    primaryPhone: { type: String, trim: true },
    secondaryPhone: { type: String, trim: true },
    mobile: { type: String, trim: true },
    fax: { type: String, trim: true },
    website: { type: String, trim: true, lowercase: true },
    address: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    country: { type: String, trim: true, default: 'India' },
    pincode: { 
      type: String, 
      trim: true, 
      validate: {
        validator: function(v: string) {
          return !v || /^[0-9]{6}$/.test(v);
        },
        message: 'Invalid PIN code format'
      }
    }
  },
  bankDetails: {
    accountNumber: { type: String, trim: true },
    ifscCode: { 
      type: String, 
      trim: true, 
      uppercase: true, 
      validate: {
        validator: function(v: string) {
          return !v || /^[A-Z]{4}0[A-Z0-9]{6}$/.test(v);
        },
        message: 'Invalid IFSC code format'
      }
    },
    bankName: { type: String, trim: true },
    branch: { type: String, trim: true },
    accountType: {
      type: String,
      enum: ['savings', 'current', 'cc', 'od'],
      default: 'savings'
    },
    swiftCode: { type: String, trim: true, uppercase: true }
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
  },
  isUniversal: {
    type: Boolean,
    default: false,
    index: true
  },
  companyId: {
    type: Schema.Types.ObjectId,
    ref: 'Company'
  }
}, {
  timestamps: true
});

AccountSchema.index({ code: 1 });
AccountSchema.index({ type: 1 });
AccountSchema.index({ isActive: 1 });
AccountSchema.index({ subGroupId: 1 });
AccountSchema.index({ type: 1, isActive: 1 });
AccountSchema.index({ 'taxInfo.gstNo': 1 });
AccountSchema.index({ 'taxInfo.panNo': 1 });
AccountSchema.index({ name: 'text', code: 'text' });

const Account = mongoose.model<IAccount>('Account', AccountSchema);
export { Account };
export default Account;
