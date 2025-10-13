// backend/src/models/Settings.ts
import mongoose, { Schema, Document } from 'mongoose';

export enum SettingScope {
  GLOBAL = 'global',
  ORGANIZATION = 'organization',
  USER = 'user'
}

export interface ISetting extends Document {
  key: string;
  value: any;
  scope: SettingScope;
  userId?: mongoose.Types.ObjectId;
  organizationId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SettingSchema: Schema = new Schema(
  {
    key: {
      type: String,
      required: true,
    },
    value: {
      type: Schema.Types.Mixed,
      required: true,
    },
    scope: {
      type: String,
      enum: Object.values(SettingScope),
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: function() {
        return this.scope === SettingScope.USER;
      }
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: function() {
        return this.scope === SettingScope.ORGANIZATION;
      }
    }
  },
  {
    timestamps: true
  }
);

// Create a compound index for efficient lookups
SettingSchema.index({ key: 1, scope: 1, userId: 1, organizationId: 1 }, { unique: true });

// Create a model from the schema
const Setting = mongoose.model<ISetting>('Setting', SettingSchema);

export default Setting;