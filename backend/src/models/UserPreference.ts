import mongoose, { Document, Schema } from 'mongoose';

export const THEMES = ['light', 'dark', 'system'] as const;
export const FONT_SIZES = ['small', 'medium', 'large'] as const;
export const NUMBER_FORMATS = ['auto', 'indian', 'international'] as const;

export type Theme = (typeof THEMES)[number];
export type FontSize = (typeof FONT_SIZES)[number];
export type NumberFormat = (typeof NUMBER_FORMATS)[number];

export interface IUserPreference extends Document {
  user: mongoose.Types.ObjectId;
  theme: Theme;
  fontSize: FontSize;
  compactMode: boolean;
  sidebarCollapsed: boolean;
  currency: string;
  numberFormat: NumberFormat;
  timezone: string;
  createdAt: Date;
  updatedAt: Date;
}

const isSupportedTimezone = (value: string): boolean => {
  try {
    new Intl.DateTimeFormat(undefined, { timeZone: value });
    return true;
  } catch {
    return false;
  }
};

const UserPreferenceSchema = new Schema<IUserPreference>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    theme: { type: String, enum: THEMES, default: 'system' },
    fontSize: { type: String, enum: FONT_SIZES, default: 'medium' },
    compactMode: { type: Boolean, default: false },
    sidebarCollapsed: { type: Boolean, default: false },
    // ISO 4217 shape rather than a fixed list, so adding a currency to the picker
    // does not require a schema change here.
    currency: {
      type: String,
      default: 'INR',
      uppercase: true,
      match: [/^[A-Z]{3}$/, 'Currency must be a three-letter ISO 4217 code']
    },
    numberFormat: { type: String, enum: NUMBER_FORMATS, default: 'auto' },
    timezone: {
      type: String,
      default: 'UTC',
      validate: {
        validator: isSupportedTimezone,
        message: 'Unrecognised IANA timezone'
      }
    }
  },
  { timestamps: true }
);

UserPreferenceSchema.index({ user: 1 });

export const UserPreference = mongoose.model<IUserPreference>('UserPreference', UserPreferenceSchema);

export default UserPreference;
