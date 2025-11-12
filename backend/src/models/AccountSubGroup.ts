import mongoose, { Document, Schema } from 'mongoose';

export interface IAccountSubGroup extends Document {
  code: string;
  name: string;
  groupId: mongoose.Types.ObjectId;
  parentSubGroupId?: mongoose.Types.ObjectId;
  level: number;
  description?: string;
  isActive: boolean;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AccountSubGroupSchema = new Schema<IAccountSubGroup>({
  code: { type: String, required: true, unique: true, trim: true },
  name: { type: String, required: true, trim: true },
  groupId: { type: Schema.Types.ObjectId, ref: 'AccountGroup', required: true },
  parentSubGroupId: { type: Schema.Types.ObjectId, ref: 'AccountSubGroup' },
  level: { type: Number, default: 1 },
  description: { type: String, trim: true },
  isActive: { type: Boolean, default: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

AccountSubGroupSchema.index({ code: 1 });
AccountSubGroupSchema.index({ groupId: 1 });
AccountSubGroupSchema.index({ parentSubGroupId: 1 });
AccountSubGroupSchema.index({ level: 1 });

export const AccountSubGroup = mongoose.model<IAccountSubGroup>('AccountSubGroup', AccountSubGroupSchema);
