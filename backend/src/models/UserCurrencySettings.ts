import mongoose, { Document, Schema } from 'mongoose';

export interface IUserCurrencySettings extends Document {
  user: mongoose.Types.ObjectId;
  preferredCurrency: string;
  numberFormat: 'indian' | 'international' | 'auto';
  createdAt: Date;
  updatedAt: Date;
}

const UserCurrencySettingsSchema = new Schema<IUserCurrencySettings>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  preferredCurrency: {
    type: String,
    default: 'USD'
  },
  numberFormat: {
    type: String,
    enum: ['indian', 'international', 'auto'],
    default: 'auto'
  }
}, { timestamps: true });

UserCurrencySettingsSchema.index({ user: 1 });

export default mongoose.model<IUserCurrencySettings>('UserCurrencySettings', UserCurrencySettingsSchema);
