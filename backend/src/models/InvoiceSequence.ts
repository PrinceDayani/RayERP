import mongoose, { Document, Schema } from 'mongoose';

export interface IInvoiceSequence extends Document {
  prefix: string;
  currentNumber: number;
  year: number;
  month?: number;
  lastGeneratedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const invoiceSequenceSchema = new Schema<IInvoiceSequence>({
  prefix: { type: String, required: true, trim: true },
  currentNumber: { type: Number, required: true, default: 0 },
  year: { type: Number, required: true },
  month: { type: Number },
  lastGeneratedAt: { type: Date, default: Date.now }
}, { timestamps: true });

invoiceSequenceSchema.index({ prefix: 1, year: 1, month: 1 }, { unique: true });

export default mongoose.model<IInvoiceSequence>('InvoiceSequence', invoiceSequenceSchema);
