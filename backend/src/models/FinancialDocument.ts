import mongoose, { Schema, Document } from 'mongoose';

export interface IFinancialDocument extends Document {
  name: string;
  type: 'INVOICE' | 'RECEIPT' | 'BILL' | 'OTHER';
  fileUrl: string;
  linkedTo: { entityType: string; entityId: mongoose.Types.ObjectId };
  uploadedBy: mongoose.Types.ObjectId;
  uploadedAt: Date;
}

const FinancialDocumentSchema = new Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['INVOICE', 'RECEIPT', 'BILL', 'OTHER'], required: true },
  fileUrl: { type: String, required: true },
  linkedTo: {
    entityType: { type: String, required: true },
    entityId: { type: Schema.Types.ObjectId, required: true }
  },
  uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  uploadedAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model<IFinancialDocument>('FinancialDocument', FinancialDocumentSchema);
