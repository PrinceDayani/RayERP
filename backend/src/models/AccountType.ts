import mongoose, { Schema, Document } from 'mongoose';

export interface IAccountType extends Document {
  name: string;
  value: string;
  description?: string;
  nature: 'debit' | 'credit';
  isSystem: boolean;
  isActive: boolean;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AccountTypeSchema = new Schema<IAccountType>({
  name: { type: String, required: true, unique: true, trim: true },
  value: { type: String, required: true, unique: true, lowercase: true, trim: true },
  description: { type: String, trim: true, maxlength: 200 },
  nature: { type: String, enum: ['debit', 'credit'], required: true },
  isSystem: { type: Boolean, default: false, index: true },
  isActive: { type: Boolean, default: true, index: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Indexes for performance
AccountTypeSchema.index({ name: 1, isActive: 1 });
AccountTypeSchema.index({ value: 1, isActive: 1 });
AccountTypeSchema.index({ isSystem: 1, isActive: 1 });

export const AccountType = mongoose.model<IAccountType>('AccountType', AccountTypeSchema);
