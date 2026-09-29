import mongoose, { Document, Schema } from 'mongoose';

export interface IHoliday extends Document {
  name: string;
  // Calendar day in the business timezone, YYYY-MM-DD. Stored as a string so
  // the day never shifts with the server's or the viewer's timezone.
  date: string;
  year: number;
  type: 'public' | 'optional';
  description?: string;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const holidaySchema = new Schema<IHoliday>({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
  year: { type: Number, required: true },
  type: { type: String, enum: ['public', 'optional'], default: 'public' },
  description: { type: String, trim: true, maxlength: 300 },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

holidaySchema.index({ date: 1, name: 1 }, { unique: true });
holidaySchema.index({ year: 1, date: 1 });

export default mongoose.model<IHoliday>('Holiday', holidaySchema);
