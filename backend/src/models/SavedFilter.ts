import mongoose, { Schema, Document } from 'mongoose';

export interface ISavedFilter extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  module: string;
  filters: any;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SavedFilterSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  module: { type: String, required: true },
  filters: { type: Schema.Types.Mixed, required: true },
  isDefault: { type: Boolean, default: false }
}, { timestamps: true });

SavedFilterSchema.index({ userId: 1, module: 1 });

export default mongoose.model<ISavedFilter>('SavedFilter', SavedFilterSchema);
