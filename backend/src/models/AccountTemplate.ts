import mongoose, { Document, Schema } from 'mongoose';

export interface IAccountTemplate extends Document {
  name: string;
  industry: string;
  description?: string;
  accounts: Array<{
    code: string;
    name: string;
    type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
    parentCode?: string;
    isGroup: boolean;
    level: number;
  }>;
  isActive: boolean;
  createdAt: Date;
}

const AccountTemplateSchema = new Schema<IAccountTemplate>({
  name: { type: String, required: true },
  industry: { type: String, required: true },
  description: String,
  accounts: [{
    code: { type: String, required: true },
    name: { type: String, required: true },
    type: { type: String, enum: ['asset', 'liability', 'equity', 'revenue', 'expense'], required: true },
    parentCode: String,
    isGroup: { type: Boolean, default: false },
    level: { type: Number, default: 0 }
  }],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export const AccountTemplate = mongoose.model<IAccountTemplate>('AccountTemplate', AccountTemplateSchema);

// Account Mapping Model
export interface IAccountMapping extends Document {
  externalSystem: string;
  externalAccountCode: string;
  internalAccountId: mongoose.Types.ObjectId;
  mappingRules?: Record<string, any>;
  isActive: boolean;
}

const AccountMappingSchema = new Schema<IAccountMapping>({
  externalSystem: { type: String, required: true },
  externalAccountCode: { type: String, required: true },
  internalAccountId: { type: Schema.Types.ObjectId, ref: 'Account', required: true },
  mappingRules: Schema.Types.Mixed,
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

AccountMappingSchema.index({ externalSystem: 1, externalAccountCode: 1 }, { unique: true });

export const AccountMapping = mongoose.model<IAccountMapping>('AccountMapping', AccountMappingSchema);

// Opening Balance Model
export interface IOpeningBalance extends Document {
  accountId: mongoose.Types.ObjectId;
  fiscalYear: string;
  debitBalance: number;
  creditBalance: number;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const OpeningBalanceSchema = new Schema<IOpeningBalance>({
  accountId: { type: Schema.Types.ObjectId, ref: 'Account', required: true },
  fiscalYear: { type: String, required: true },
  debitBalance: { type: Number, default: 0 },
  creditBalance: { type: Number, default: 0 },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

OpeningBalanceSchema.index({ accountId: 1, fiscalYear: 1 }, { unique: true });

export const OpeningBalance = mongoose.model<IOpeningBalance>('OpeningBalance', OpeningBalanceSchema);
