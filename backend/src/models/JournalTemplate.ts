import mongoose, { Document, Schema } from 'mongoose';

export interface IJournalTemplateLine {
  accountId: mongoose.Types.ObjectId;
  debitFormula?: string;
  creditFormula?: string;
  description: string;
  isVariable: boolean;
}

export interface IJournalTemplate extends Document {
  name: string;
  description?: string;
  category: 'depreciation' | 'accrual' | 'adjustment' | 'allocation' | 'other';
  lines: IJournalTemplateLine[];
  isActive: boolean;
  usageCount: number;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const JournalTemplateLineSchema = new Schema<IJournalTemplateLine>({
  accountId: { type: Schema.Types.ObjectId, ref: 'Account', required: true },
  debitFormula: String,
  creditFormula: String,
  description: { type: String, required: true },
  isVariable: { type: Boolean, default: false }
});

const JournalTemplateSchema = new Schema<IJournalTemplate>({
  name: { type: String, required: true, trim: true, unique: true },
  description: String,
  category: { type: String, enum: ['depreciation', 'accrual', 'adjustment', 'allocation', 'other'], default: 'other' },
  lines: [JournalTemplateLineSchema],
  isActive: { type: Boolean, default: true },
  usageCount: { type: Number, default: 0 },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

export default mongoose.model<IJournalTemplate>('JournalTemplate', JournalTemplateSchema);
