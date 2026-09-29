import mongoose, { Document, Schema } from 'mongoose';

export interface ILocation extends Document {
  name: string;
  code?: string;
  type: 'head-office' | 'branch' | 'site' | 'warehouse';
  address: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  phone?: string;
  email?: string;
  active: boolean;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const locationSchema = new Schema<ILocation>({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  code: { type: String, trim: true, uppercase: true, maxlength: 20 },
  type: { type: String, enum: ['head-office', 'branch', 'site', 'warehouse'], default: 'branch' },
  address: {
    line1: { type: String, trim: true, maxlength: 200 },
    line2: { type: String, trim: true, maxlength: 200 },
    city: { type: String, trim: true, maxlength: 80 },
    state: { type: String, trim: true, maxlength: 80 },
    postalCode: { type: String, trim: true, maxlength: 20 },
    country: { type: String, trim: true, maxlength: 80 },
  },
  phone: { type: String, trim: true, maxlength: 30 },
  email: { type: String, trim: true, lowercase: true, maxlength: 120 },
  active: { type: Boolean, default: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

locationSchema.index({ name: 1 }, { unique: true });
locationSchema.index({ code: 1 }, { unique: true, partialFilterExpression: { code: { $type: 'string' } } });
locationSchema.index({ active: 1 });

export default mongoose.model<ILocation>('Location', locationSchema);
