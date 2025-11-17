//path: backend/src/models/ProjectLedger.ts

import mongoose, { Document, Schema } from 'mongoose';

export interface IProjectJournalEntry extends Document {
  projectId: mongoose.Types.ObjectId;
  entryNumber: string;
  date: Date;
  reference: string;
  description: string;
  narration?: string;
  lines: IProjectJournalLine[];
  totalDebit: number;
  totalCredit: number;
  attachments?: string[];
  status: 'draft' | 'posted' | 'approved';
  createdBy: mongoose.Types.ObjectId;
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProjectJournalLine {
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  description: string;
}

export interface IProjectBudgetActual extends Document {
  projectId: mongoose.Types.ObjectId;
  fiscalYear: string;
  budgetedRevenue: number;
  actualRevenue: number;
  budgetedCost: number;
  actualCost: number;
  budgetedProfit: number;
  actualProfit: number;
  variance: number;
  variancePercent: number;
  utilizationPercent: number;
  categories: IProjectBudgetCategory[];
  alerts: IProjectBudgetAlert[];
  lastUpdated: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProjectBudgetCategory {
  name: string;
  budgeted: number;
  actual: number;
  variance: number;
  variancePercent: number;
}

export interface IProjectBudgetAlert {
  type: 'warning' | 'critical';
  message: string;
  threshold: number;
  current: number;
  createdAt: Date;
}

export interface IProjectProfitability extends Document {
  projectId: mongoose.Types.ObjectId;
  period: string;
  revenue: number;
  directCosts: number;
  indirectCosts: number;
  totalCosts: number;
  grossProfit: number;
  grossMargin: number;
  netProfit: number;
  netMargin: number;
  roi: number;
  breakEvenPoint: number;
  profitTrend: IProfitTrendPoint[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IProfitTrendPoint {
  month: string;
  revenue: number;
  cost: number;
  profit: number;
  margin: number;
}

const projectJournalLineSchema = new Schema<IProjectJournalLine>({
  accountCode: { type: String, required: true },
  accountName: { type: String, required: true },
  debit: { type: Number, default: 0, min: 0 },
  credit: { type: Number, default: 0, min: 0 },
  description: { type: String, required: true }
});

const projectJournalEntrySchema = new Schema<IProjectJournalEntry>({
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  entryNumber: { type: String, required: true, unique: true },
  date: { type: Date, required: true },
  reference: { type: String, required: true },
  description: { type: String, required: true },
  narration: { type: String },
  lines: [projectJournalLineSchema],
  totalDebit: { type: Number, required: true, min: 0 },
  totalCredit: { type: Number, required: true, min: 0 },
  attachments: [{ type: String }],
  status: { 
    type: String, 
    enum: ['draft', 'posted', 'approved'], 
    default: 'draft' 
  },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  approvedAt: { type: Date }
}, { timestamps: true });

const projectBudgetCategorySchema = new Schema<IProjectBudgetCategory>({
  name: { type: String, required: true },
  budgeted: { type: Number, required: true },
  actual: { type: Number, default: 0 },
  variance: { type: Number, default: 0 },
  variancePercent: { type: Number, default: 0 }
});

const projectBudgetAlertSchema = new Schema<IProjectBudgetAlert>({
  type: { type: String, enum: ['warning', 'critical'], required: true },
  message: { type: String, required: true },
  threshold: { type: Number, required: true },
  current: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

const projectBudgetActualSchema = new Schema<IProjectBudgetActual>({
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, unique: true },
  fiscalYear: { type: String, required: true },
  budgetedRevenue: { type: Number, default: 0 },
  actualRevenue: { type: Number, default: 0 },
  budgetedCost: { type: Number, default: 0 },
  actualCost: { type: Number, default: 0 },
  budgetedProfit: { type: Number, default: 0 },
  actualProfit: { type: Number, default: 0 },
  variance: { type: Number, default: 0 },
  variancePercent: { type: Number, default: 0 },
  utilizationPercent: { type: Number, default: 0 },
  categories: [projectBudgetCategorySchema],
  alerts: [projectBudgetAlertSchema],
  lastUpdated: { type: Date, default: Date.now }
}, { timestamps: true });

const profitTrendPointSchema = new Schema<IProfitTrendPoint>({
  month: { type: String, required: true },
  revenue: { type: Number, default: 0 },
  cost: { type: Number, default: 0 },
  profit: { type: Number, default: 0 },
  margin: { type: Number, default: 0 }
});

const projectProfitabilitySchema = new Schema<IProjectProfitability>({
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, unique: true },
  period: { type: String, required: true },
  revenue: { type: Number, default: 0 },
  directCosts: { type: Number, default: 0 },
  indirectCosts: { type: Number, default: 0 },
  totalCosts: { type: Number, default: 0 },
  grossProfit: { type: Number, default: 0 },
  grossMargin: { type: Number, default: 0 },
  netProfit: { type: Number, default: 0 },
  netMargin: { type: Number, default: 0 },
  roi: { type: Number, default: 0 },
  breakEvenPoint: { type: Number, default: 0 },
  profitTrend: [profitTrendPointSchema]
}, { timestamps: true });

// Indexes
projectJournalEntrySchema.index({ projectId: 1, date: -1 });
projectJournalEntrySchema.index({ entryNumber: 1 });
projectJournalEntrySchema.index({ status: 1 });
projectBudgetActualSchema.index({ projectId: 1 });
projectProfitabilitySchema.index({ projectId: 1 });

export const ProjectJournalEntry = mongoose.model<IProjectJournalEntry>('ProjectJournalEntry', projectJournalEntrySchema);
export const ProjectBudgetActual = mongoose.model<IProjectBudgetActual>('ProjectBudgetActual', projectBudgetActualSchema);
export const ProjectProfitability = mongoose.model<IProjectProfitability>('ProjectProfitability', projectProfitabilitySchema);

export default ProjectJournalEntry;