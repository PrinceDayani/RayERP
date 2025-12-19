import mongoose, { Schema, Document } from 'mongoose';

export interface IFinancialDocument extends Document {
  name: string;
  type: 'INVOICE' | 'RECEIPT' | 'BILL' | 'CONTRACT' | 'REPORT' | 'CERTIFICATE' | 'OTHER';
  fileUrl: string;
  fileData?: string;
  mimeType?: string;
  fileSize?: number;
  linkedTo: { entityType: string; entityId: mongoose.Types.ObjectId | string };
  uploadedBy: mongoose.Types.ObjectId;
  uploadedAt: Date;
  status?: 'ACTIVE' | 'ARCHIVED' | 'PENDING_REVIEW';
}

const FinancialDocumentSchema = new Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['INVOICE', 'RECEIPT', 'BILL', 'CONTRACT', 'REPORT', 'CERTIFICATE', 'OTHER'], default: 'OTHER' },
  fileUrl: { type: String, required: true },
  fileData: { type: String },
  mimeType: { type: String },
  fileSize: { type: Number },
  linkedTo: {
    entityType: { type: String, default: 'GENERAL' },
    entityId: { type: Schema.Types.Mixed, default: 'none' }
  },
  uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  uploadedAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['ACTIVE', 'ARCHIVED', 'PENDING_REVIEW'], default: 'ACTIVE' }
}, { timestamps: true });

export default mongoose.model<IFinancialDocument>('FinancialDocument', FinancialDocumentSchema);
