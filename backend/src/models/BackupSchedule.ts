import mongoose, { Document, Schema } from 'mongoose';

export interface IBackupSchedule extends Document {
  name: string;
  description?: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string; // HH:MM format
  dayOfWeek?: number; // 0-6 for weekly
  dayOfMonth?: number; // 1-31 for monthly
  backupType: 'database' | 'files' | 'full' | 'incremental';
  modules: string[];
  isEncrypted: boolean;
  storageLocation: 'local' | 'cloud' | 'external';
  isActive: boolean;
  lastRun?: Date;
  nextRun: Date;
  createdBy: {
    id: mongoose.Types.ObjectId;
    name: string;
    email: string;
  };
  retentionDays: number;
}

const BackupScheduleSchema = new Schema<IBackupSchedule>({
  name: { type: String, required: true },
  description: { type: String },
  frequency: { type: String, enum: ['daily', 'weekly', 'monthly'], required: true },
  time: { type: String, required: true }, // HH:MM format
  dayOfWeek: { type: Number, min: 0, max: 6 }, // Sunday = 0
  dayOfMonth: { type: Number, min: 1, max: 31 },
  backupType: { type: String, enum: ['database', 'files', 'full', 'incremental'], required: true },
  modules: [{ type: String }],
  isEncrypted: { type: Boolean, default: false },
  storageLocation: { type: String, enum: ['local', 'cloud', 'external'], default: 'local' },
  isActive: { type: Boolean, default: true },
  lastRun: { type: Date },
  nextRun: { type: Date, required: true },
  createdBy: {
    id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    email: { type: String, required: true }
  },
  retentionDays: { type: Number, default: 30 }
}, {
  timestamps: true
});

BackupScheduleSchema.index({ nextRun: 1, isActive: 1 });
BackupScheduleSchema.index({ createdBy: 1 });

export default mongoose.model<IBackupSchedule>('BackupSchedule', BackupScheduleSchema);