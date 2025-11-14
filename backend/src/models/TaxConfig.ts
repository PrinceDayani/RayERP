import mongoose, { Schema, Document } from 'mongoose';

export interface ITaxConfig extends Document {
  name: string;
  type: 'GST' | 'VAT' | 'TDS' | 'TCS' | 'SALES_TAX';
  rate: number;
  isActive: boolean;
  applicableFrom: Date;
  applicableTo?: Date;
}

const TaxConfigSchema = new Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['GST', 'VAT', 'TDS', 'TCS', 'SALES_TAX'], required: true },
  rate: { type: Number, required: true, min: 0, max: 100 },
  isActive: { type: Boolean, default: true },
  applicableFrom: { type: Date, required: true },
  applicableTo: Date
}, { timestamps: true });

export default mongoose.model<ITaxConfig>('TaxConfig', TaxConfigSchema);
