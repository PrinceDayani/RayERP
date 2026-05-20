import mongoose, { Document, Schema } from 'mongoose';

export interface IFinancialEntry extends Document {
  project: mongoose.Types.ObjectId;
  entryType: 'payment-made' | 'payment-received' | 'invoice-raised' | 'expense';
  amount: number;
  currency: string;
  description: string;
  vendorOrClient?: string;
  department?: mongoose.Types.ObjectId;
  referenceNumber?: string;
  date: Date;
  reportedBy: mongoose.Types.ObjectId;
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  attachments: string[];
  category: 'material' | 'labor' | 'equipment' | 'subcontractor' | 'overhead' | 'other';
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const financialEntrySchema = new Schema<IFinancialEntry>({
  project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  entryType: {
    type: String,
    enum: ['payment-made', 'payment-received', 'invoice-raised', 'expense'],
    required: true
  },
  amount: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'INR', trim: true, uppercase: true },
  description: { type: String, required: true },
  vendorOrClient: { type: String },
  department: { type: Schema.Types.ObjectId, ref: 'Department' },
  referenceNumber: { type: String },
  date: { type: Date, required: true },
  reportedBy: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  approvedBy: { type: Schema.Types.ObjectId, ref: 'Employee' },
  approvedAt: { type: Date },
  attachments: [{ type: String }],
  category: {
    type: String,
    enum: ['material', 'labor', 'equipment', 'subcontractor', 'overhead', 'other'],
    default: 'other'
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  rejectionReason: { type: String }
}, { timestamps: true });

// Indexes
financialEntrySchema.index({ project: 1, date: -1 });
financialEntrySchema.index({ project: 1, entryType: 1 });
financialEntrySchema.index({ project: 1, department: 1 });
financialEntrySchema.index({ project: 1, status: 1 });
financialEntrySchema.index({ reportedBy: 1, date: -1 });
financialEntrySchema.index({ project: 1, category: 1 });

export default mongoose.model<IFinancialEntry>('FinancialEntry', financialEntrySchema);
