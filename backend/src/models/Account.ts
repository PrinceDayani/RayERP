import mongoose, { Document, Schema } from 'mongoose';

export interface IAccount extends Document {
  code: string;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  subType: string;
  projectId?: mongoose.Types.ObjectId;
  balance: number;
  isActive: boolean;
  description?: string;
  createdBy: mongoose.Types.ObjectId;
  openingBalance: number;
  currency: string;
  parentId?: mongoose.Types.ObjectId;
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
  description: {
    type: String,
    trim: true
  },
  projectId: {
    type: Schema.Types.ObjectId,
    ref: 'Project'
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
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
