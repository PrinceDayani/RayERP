import mongoose, { Document, Schema } from 'mongoose';

export interface IDepartmentBreakdown {
  department: mongoose.Types.ObjectId;
  departmentName?: string;
  allocated: number;
  spent: number;
  received: number;
  progress: number;
}

export interface IProjectProgressSnapshot extends Document {
  project: mongoose.Types.ObjectId;
  snapshotDate: Date;
  period: 'daily' | 'weekly' | 'monthly';
  taskProgress: number;
  financialProgress: number;
  effectiveProgress: number;
  totalBudget: number;
  totalSpent: number;
  totalReceived: number;
  reportCount: number;
  blockerCount: number;
  unresolvedBlockers: number;
  healthScore: 'healthy' | 'at-risk' | 'critical';
  departmentBreakdown: IDepartmentBreakdown[];
  generatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const departmentBreakdownSchema = new Schema({
  department: { type: Schema.Types.ObjectId, ref: 'Department', required: true },
  departmentName: { type: String },
  allocated: { type: Number, default: 0 },
  spent: { type: Number, default: 0 },
  received: { type: Number, default: 0 },
  progress: { type: Number, min: 0, max: 100, default: 0 }
}, { _id: false });

const projectProgressSnapshotSchema = new Schema<IProjectProgressSnapshot>({
  project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  snapshotDate: { type: Date, required: true },
  period: {
    type: String,
    enum: ['daily', 'weekly', 'monthly'],
    default: 'daily'
  },
  taskProgress: { type: Number, min: 0, max: 100, default: 0 },
  financialProgress: { type: Number, min: 0, max: 100, default: 0 },
  effectiveProgress: { type: Number, min: 0, max: 100, default: 0 },
  totalBudget: { type: Number, default: 0 },
  totalSpent: { type: Number, default: 0 },
  totalReceived: { type: Number, default: 0 },
  reportCount: { type: Number, default: 0 },
  blockerCount: { type: Number, default: 0 },
  unresolvedBlockers: { type: Number, default: 0 },
  healthScore: {
    type: String,
    enum: ['healthy', 'at-risk', 'critical'],
    default: 'healthy'
  },
  departmentBreakdown: [departmentBreakdownSchema],
  generatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Indexes
projectProgressSnapshotSchema.index({ project: 1, snapshotDate: -1 });
projectProgressSnapshotSchema.index({ project: 1, period: 1, snapshotDate: -1 });
projectProgressSnapshotSchema.index({ project: 1, snapshotDate: 1, period: 1 }, { unique: true });

export default mongoose.model<IProjectProgressSnapshot>('ProjectProgressSnapshot', projectProgressSnapshotSchema);
