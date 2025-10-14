import mongoose, { Document, Schema } from 'mongoose';

export interface IAccount extends Document {
  code: string;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  subType?: string;
  balance: number;
  openingBalance: number;
  currency: string;
  parentId?: mongoose.Types.ObjectId;
  isActive: boolean;
  description?: string;
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
    default: 'USD',
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
  }
}, {
  timestamps: true
});

AccountSchema.index({ code: 1 });
AccountSchema.index({ type: 1 });
AccountSchema.index({ isActive: 1 });
AccountSchema.index({ type: 1, isActive: 1 });

export const Account = mongoose.model<IAccount>('Account', AccountSchema);