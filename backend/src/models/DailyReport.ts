import mongoose, { Document, Schema } from 'mongoose';

export interface IActivity {
  description: string;
  category: 'construction' | 'procurement' | 'design' | 'inspection' | 'administrative' | 'other';
  hoursSpent: number;
  quantityCompleted?: string;
  attachments?: string[];
}

export interface IBlocker {
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  isResolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: mongoose.Types.ObjectId;
}

export interface IReportFinancials {
  paymentsProcessed: number;
  invoicesReceived: number;
  vendor?: string;
  paymentReference?: string;
}

export interface IDailyReport extends Document {
  reportedBy: mongoose.Types.ObjectId;
  project: mongoose.Types.ObjectId;
  reportDate: Date;
  reportType: 'daily' | 'weekly' | 'milestone';
  activities: IActivity[];
  financials?: IReportFinancials;
  blockers: IBlocker[];
  nextSteps: string[];
  notes?: string;
  status: 'draft' | 'submitted' | 'acknowledged';
  acknowledgedBy?: mongoose.Types.ObjectId;
  acknowledgedAt?: Date;
  totalHours: number;
  customFieldValues?: Map<string, any>;
  templateVersion?: number;
  createdAt: Date;
  updatedAt: Date;
}

const activitySchema = new Schema({
  description: { type: String, required: true },
  category: {
    type: String,
    enum: ['construction', 'procurement', 'design', 'inspection', 'administrative', 'other'],
    default: 'other'
  },
  hoursSpent: { type: Number, required: true, min: 0 },
  quantityCompleted: { type: String },
  attachments: [{ type: String }]
}, { _id: true });

const blockerSchema = new Schema({
  description: { type: String, required: true },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  isResolved: { type: Boolean, default: false },
  resolvedAt: { type: Date },
  resolvedBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, { _id: true });

const reportFinancialsSchema = new Schema({
  paymentsProcessed: { type: Number, default: 0 },
  invoicesReceived: { type: Number, default: 0 },
  vendor: { type: String },
  paymentReference: { type: String }
}, { _id: false });

const dailyReportSchema = new Schema<IDailyReport>({
  reportedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  reportDate: { type: Date, required: true },
  reportType: {
    type: String,
    enum: ['daily', 'weekly', 'milestone'],
    default: 'daily'
  },
  activities: [activitySchema],
  financials: { type: reportFinancialsSchema },
  blockers: [blockerSchema],
  nextSteps: [{ type: String }],
  notes: { type: String },
  status: {
    type: String,
    enum: ['draft', 'submitted', 'acknowledged'],
    default: 'draft'
  },
  acknowledgedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  acknowledgedAt: { type: Date },
  totalHours: { type: Number, default: 0 },
  customFieldValues: { type: Map, of: Schema.Types.Mixed },
  templateVersion: { type: Number }
}, { timestamps: true });

// Auto-calculate totalHours before save
dailyReportSchema.pre('save', function (next) {
  if (this.activities && this.activities.length > 0) {
    this.totalHours = this.activities.reduce((sum, act) => sum + (act.hoursSpent || 0), 0);
  }
  next();
});

// Indexes
dailyReportSchema.index({ project: 1, reportDate: -1 });
dailyReportSchema.index({ reportedBy: 1, reportDate: -1 });
dailyReportSchema.index({ project: 1, reportedBy: 1, reportDate: 1 }, { unique: true });
dailyReportSchema.index({ project: 1, status: 1 });
dailyReportSchema.index({ reportDate: -1 });

export default mongoose.model<IDailyReport>('DailyReport', dailyReportSchema);
