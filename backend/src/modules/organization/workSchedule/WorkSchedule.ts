import mongoose, { Document, Schema } from 'mongoose';

// A weekday that is off, either every week or only on the listed weeks of the
// month (week n covers days 7n-6..7n, so "2nd and 4th Saturday" is day 6,
// weeks [2, 4]). Days follow Date.getDay(): 0 = Sunday.
export interface IWeeklyOff {
  day: number;
  weeks: number[];
}

export interface IWorkSchedule extends Document {
  name: string;
  description?: string;
  startTime: string;
  endTime: string;
  lateGraceMinutes: number;
  halfDayHours: number;
  fullDayHours: number;
  breakMinutes: number;
  weeklyOffs: IWeeklyOff[];
  // The organisation's general timings; exactly one schedule may carry it.
  isDefault: boolean;
  active: boolean;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

const weeklyOffSchema = new Schema<IWeeklyOff>({
  day: { type: Number, required: true, min: 0, max: 6 },
  weeks: { type: [{ type: Number, min: 1, max: 5 }], default: [] },
}, { _id: false });

const workScheduleSchema = new Schema<IWorkSchedule>({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  description: { type: String, trim: true, maxlength: 300 },
  startTime: { type: String, required: true, match: TIME },
  endTime: { type: String, required: true, match: TIME },
  lateGraceMinutes: { type: Number, required: true, min: 0, max: 240 },
  halfDayHours: { type: Number, required: true, min: 0, max: 24 },
  fullDayHours: { type: Number, required: true, min: 0, max: 24 },
  breakMinutes: { type: Number, default: 0, min: 0, max: 600 },
  weeklyOffs: { type: [weeklyOffSchema], default: [] },
  isDefault: { type: Boolean, default: false },
  active: { type: Boolean, default: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

workScheduleSchema.index({ name: 1 }, { unique: true });
workScheduleSchema.index(
  { isDefault: 1 },
  { unique: true, partialFilterExpression: { isDefault: true } }
);

export default mongoose.model<IWorkSchedule>('WorkSchedule', workScheduleSchema);
