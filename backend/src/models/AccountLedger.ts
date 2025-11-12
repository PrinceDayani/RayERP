import mongoose, { Document, Schema } from 'mongoose';

export interface IAccountLedger extends Document {
  code: string;
  name: string;
  accountId: mongoose.Types.ObjectId;
  openingBalance: number;
  currentBalance: number;
  balanceType: 'debit' | 'credit';
  currency: string;
  isActive: boolean;
  gstInfo?: {
    gstNo?: string;
    gstType?: 'regular' | 'composition' | 'unregistered';
  };
  taxInfo?: {
    panNo?: string;
    tanNo?: string;
    cinNo?: string;
    aadharNo?: string;
  };
  contactInfo?: {
    email?: string;
    phone?: string;
    mobile?: string;
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
  creditDays?: number;
  description?: string;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AccountLedgerSchema = new Schema<IAccountLedger>({
  code: { type: String, required: true, unique: true, trim: true },
  name: { type: String, required: true, trim: true },
  accountId: { type: Schema.Types.ObjectId, ref: 'Account', required: true },
  openingBalance: { type: Number, default: 0 },
  currentBalance: { type: Number, default: 0 },
  balanceType: { type: String, enum: ['debit', 'credit'], default: 'debit' },
  currency: { type: String, default: 'INR', trim: true },
  isActive: { type: Boolean, default: true },
  gstInfo: {
    gstNo: String,
    gstType: { type: String, enum: ['regular', 'composition', 'unregistered'] }
  },
  taxInfo: {
    panNo: String,
    tanNo: String,
    cinNo: String,
    aadharNo: String
  },
  contactInfo: {
    email: String,
    phone: String,
    mobile: String,
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
  creditLimit: { type: Number, default: 0 },
  creditDays: { type: Number, default: 0 },
  description: { type: String, trim: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

AccountLedgerSchema.index({ code: 1 });
AccountLedgerSchema.index({ accountId: 1 });
AccountLedgerSchema.index({ isActive: 1 });

export const AccountLedger = mongoose.model<IAccountLedger>('AccountLedger', AccountLedgerSchema);
