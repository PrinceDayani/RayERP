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

// Indexes for better performance
projectJournalEntrySchema.index({ projectId: 1, date: -1 });
projectJournalEntrySchema.index({ entryNumber: 1 });
projectJournalEntrySchema.index({ status: 1 });

export default mongoose.model<IProjectJournalEntry>('ProjectJournalEntry', projectJournalEntrySchema);