import mongoose, { Schema, Document } from 'mongoose';

export interface IBudgetReport extends Document {
  reportName: string;
  reportType: 'summary' | 'detailed' | 'variance' | 'forecast' | 'comparison' | 'custom';
  budgets: mongoose.Types.ObjectId[];
  filters: {
    fiscalYear?: string;
    departmentId?: mongoose.Types.ObjectId;
    projectId?: mongoose.Types.ObjectId;
    dateRange?: {
      startDate: Date;
      endDate: Date;
    };
    status?: string[];
  };
  format: 'pdf' | 'excel' | 'csv' | 'json';
  generatedBy: mongoose.Types.ObjectId;
  fileUrl?: string;
  fileSize?: number;
  status: 'generating' | 'completed' | 'failed';
  errorMessage?: string;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const BudgetReportSchema = new Schema<IBudgetReport>({
  reportName: { type: String, required: true },
  reportType: { 
    type: String, 
    enum: ['summary', 'detailed', 'variance', 'forecast', 'comparison', 'custom'],
    required: true 
  },
  budgets: [{ type: Schema.Types.ObjectId, ref: 'Budget' }],
  filters: {
    fiscalYear: String,
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department' },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project' },
    dateRange: {
      startDate: Date,
      endDate: Date
    },
    status: [String]
  },
  format: { 
    type: String, 
    enum: ['pdf', 'excel', 'csv', 'json'],
    required: true 
  },
  generatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  fileUrl: String,
  fileSize: Number,
  status: { 
    type: String, 
    enum: ['generating', 'completed', 'failed'],
    default: 'generating'
  },
  errorMessage: String,
  expiresAt: Date
}, { timestamps: true });

BudgetReportSchema.index({ generatedBy: 1, createdAt: -1 });
BudgetReportSchema.index({ status: 1, createdAt: -1 });
BudgetReportSchema.index({ expiresAt: 1 });

export default mongoose.model<IBudgetReport>('BudgetReport', BudgetReportSchema);
