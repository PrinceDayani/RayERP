import mongoose, { Document, Schema } from 'mongoose';

export interface IBackupLog extends Document {
  backupId: string;
  type: 'manual' | 'scheduled';
  backupType: 'database' | 'files' | 'full' | 'incremental';
  modules: string[];
  status: 'pending' | 'in-progress' | 'success' | 'failed';
  size: number;
  filePath?: string;
  storageLocation: 'local' | 'cloud' | 'external';
  cloudProvider?: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  errorMessage?: string;
  createdBy: mongoose.Types.ObjectId;
  isEncrypted: boolean;
  checksum?: string;
  isHealthy: boolean;
}

const BackupLogSchema = new Schema<IBackupLog>({
  backupId: { type: String, required: true, unique: true },
  type: { type: String, enum: ['manual', 'scheduled'], required: true },
  backupType: { type: String, enum: ['database', 'files', 'full', 'incremental'], required: true },
  modules: [{ type: String }],
  status: { type: String, enum: ['pending', 'in-progress', 'success', 'failed'], default: 'pending' },
  size: { type: Number, default: 0 },
  filePath: String,
  storageLocation: { type: String, enum: ['local', 'cloud', 'external'], required: true },
  cloudProvider: String,
  startTime: { type: Date, default: Date.now },
  endTime: Date,
  duration: Number,
  errorMessage: String,
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  isEncrypted: { type: Boolean, default: false },
  checksum: String,
  isHealthy: { type: Boolean, default: true }
}, {
  timestamps: true
});

export default mongoose.model<IBackupLog>('BackupLog', BackupLogSchema);