import mongoose, { Schema, Document } from 'mongoose';

export interface IJournalEntryTemplateLine {
  account?: mongoose.Types.ObjectId;
  accountVariable?: string; // e.g., {{EXPENSE_ACCOUNT}}
  debitVariable?: string; // e.g., {{AMOUNT}}
  creditVariable?: string;
  debitFormula?: string; // e.g., "{{AMOUNT}} * 0.18"
  creditFormula?: string;
  description?: string;
  costCenter?: mongoose.Types.ObjectId;
}

export interface IJournalEntryTemplate extends Document {
  name: string;
  description?: string;
  category: 'DEPRECIATION' | 'ACCRUAL' | 'PREPAYMENT' | 'PAYROLL' | 'TAX' | 'ADJUSTMENT' | 'CUSTOM';
  
  // Template Lines
  lines: IJournalEntryTemplateLine[];
  
  // Variables
  variables: Array<{
    name: string;
    type: 'ACCOUNT' | 'AMOUNT' | 'PERCENTAGE' | 'TEXT';
    description: string;
    defaultValue?: any;
    required: boolean;
  }>;
  
  // Auto-settings
  isRecurring: boolean;
  recurringFrequency?: 'MONTHLY' | 'QUARTERLY' | 'SEMI_ANNUALLY' | 'ANNUALLY';
  autoPost: boolean;
  
  // Active Status
  isActive: boolean;
  usageCount: number;
  
  createdBy: mongoose.Types.ObjectId;
}

const JournalEntryTemplateSchema = new Schema<IJournalEntryTemplate>({
  name: { type: String, required: true },
  description: String,
  category: { type: String, enum: ['DEPRECIATION', 'ACCRUAL', 'PREPAYMENT', 'PAYROLL', 'TAX', 'ADJUSTMENT', 'CUSTOM'], required: true },
  
  lines: [{
    account: { type: Schema.Types.ObjectId, ref: 'ChartOfAccount' },
    accountVariable: String,
    debitVariable: String,
    creditVariable: String,
    debitFormula: String,
    creditFormula: String,
    description: String,
    costCenter: { type: Schema.Types.ObjectId, ref: 'CostCenter' }
  }],
  
  variables: [{
    name: { type: String, required: true },
    type: { type: String, enum: ['ACCOUNT', 'AMOUNT', 'PERCENTAGE', 'TEXT'], required: true },
    description: String,
    defaultValue: Schema.Types.Mixed,
    required: { type: Boolean, default: false }
  }],
  
  isRecurring: { type: Boolean, default: false },
  recurringFrequency: { type: String, enum: ['MONTHLY', 'QUARTERLY', 'SEMI_ANNUALLY', 'ANNUALLY'] },
  autoPost: { type: Boolean, default: false },
  
  isActive: { type: Boolean, default: true },
  usageCount: { type: Number, default: 0 },
  
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

export default mongoose.model<IJournalEntryTemplate>('JournalEntryTemplate', JournalEntryTemplateSchema);
