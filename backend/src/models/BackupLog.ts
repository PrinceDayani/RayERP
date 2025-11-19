import mongoose, { Document, Schema } from 'mongoose';

export interface IBackupLog extends Document {
  backupId: string;
  type: 'manual' | 'scheduled';
  backupType: 'database' | 'files' | 'full' | 'incremental';
  status: 'pending' | 'in-progress' | 'success' | 'failed';
  size: number;
  duration: number;
  startTime: Date;
  endTime: Date;
  isEncrypted: boolean;
  isHealthy: boolean;
  createdBy: {
    id: mongoose.Types.ObjectId;
    name: string;
    email: string;
  };
  modules: string[];
  errorMessage?: string;
  filePath?: string;
  metadata?: any;
}

const BackupLogSchema = new Schema<IBackupLog>({
  backupId: { type: String, required: true, unique: true },
  type: { type: String, enum: ['manual', 'scheduled'], required: true },
  backupType: { type: String, enum: ['database', 'files', 'full', 'incremental'], required: true },
  status: { type: String, enum: ['pending', 'in-progress', 'success', 'failed'], default: 'pending' },
  size: { type: Number, default: 0 },
  duration: { type: Number, default: 0 },
  startTime: { type: Date, required: true },
  endTime: { type: Date },
  isEncrypted: { type: Boolean, default: false },
  isHealthy: { type: Boolean, default: true },
  createdBy: {
    id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    email: { type: String, required: true }
  },
  modules: [{ type: String }],
  errorMessage: { type: String },
  filePath: { type: String },
  metadata: { type: Schema.Types.Mixed }
}, {
  timestamps: true
});

BackupLogSchema.index({ backupId: 1 });
BackupLogSchema.index({ status: 1 });
BackupLogSchema.index({ createdAt: -1 });

export default mongoose.model<IBackupLog>('BackupLog', BackupLogSchema);