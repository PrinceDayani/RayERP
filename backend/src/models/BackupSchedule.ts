import mongoose, { Document, Schema } from 'mongoose';

export interface IBackupSchedule extends Document {
  name: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string; // HH:MM format
  dayOfWeek?: number; // 0-6 for weekly
  dayOfMonth?: number; // 1-31 for monthly
  backupType: 'database' | 'files' | 'full' | 'incremental';
  modules: string[];
  storageLocation: 'local' | 'cloud';
  cloudProvider?: string;
  isActive: boolean;
  isEncrypted: boolean;
  lastRun?: Date;
  nextRun: Date;
  createdBy: mongoose.Types.ObjectId;
}

const BackupScheduleSchema = new Schema<IBackupSchedule>({
  name: { type: String, required: true },
  frequency: { type: String, enum: ['daily', 'weekly', 'monthly'], required: true },
  time: { type: String, required: true },
  dayOfWeek: { type: Number, min: 0, max: 6 },
  dayOfMonth: { type: Number, min: 1, max: 31 },
  backupType: { type: String, enum: ['database', 'files', 'full', 'incremental'], required: true },
  modules: [{ type: String }],
  storageLocation: { type: String, enum: ['local', 'cloud'], required: true },
  cloudProvider: String,
  isActive: { type: Boolean, default: true },
  isEncrypted: { type: Boolean, default: false },
  lastRun: Date,
  nextRun: { type: Date, required: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, {
  timestamps: true
});

export default mongoose.model<IBackupSchedule>('BackupSchedule', BackupScheduleSchema);