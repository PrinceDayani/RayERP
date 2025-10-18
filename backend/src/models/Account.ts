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
  taxInfo?: {
    gstNo?: string;
    panNo?: string;
    taxRate?: number;
  };
  contactInfo?: {
    address?: string;
    phone?: string;
    email?: string;
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
    trim: true
  },
  category: {
    type: String,
    trim: true
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
    taxRate: Number
  },
  contactInfo: {
    address: String,
    phone: String,
    email: String
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
AccountSchema.index({ type: 1, isActive: 1 });

const Account = mongoose.model<IAccount>('Account', AccountSchema);
export { Account };
export default Account;
