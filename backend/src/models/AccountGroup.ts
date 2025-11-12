import mongoose, { Document, Schema } from 'mongoose';

export interface IAccountGroup extends Document {
  code: string;
  name: string;
  type: 'assets' | 'liabilities' | 'income' | 'expenses';
  description?: string;
  isActive: boolean;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AccountGroupSchema = new Schema<IAccountGroup>({
  code: { type: String, required: true, unique: true, trim: true },
  name: { type: String, required: true, trim: true },
  type: { type: String, required: true, enum: ['assets', 'liabilities', 'income', 'expenses'] },
  description: { type: String, trim: true },
  isActive: { type: Boolean, default: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

AccountGroupSchema.index({ code: 1 });
AccountGroupSchema.index({ type: 1 });

export const AccountGroup = mongoose.model<IAccountGroup>('AccountGroup', AccountGroupSchema);
