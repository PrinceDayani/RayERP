import mongoose, { Schema, Document } from 'mongoose';

export interface IInvoiceTemplate extends Document {
  name: string;
  description?: string;
  isDefault: boolean;
  
  // Branding
  logo?: string;
  companyName: string;
  companyAddress: string;
  companyPhone?: string;
  companyEmail?: string;
  companyGSTIN?: string;
  companyWebsite?: string;
  
  // Layout
  layout: 'STANDARD' | 'MODERN' | 'CLASSIC' | 'MINIMAL';
  colorScheme: string;
  fontSize: number;
  
  // Fields
  showLineNumbers: boolean;
  showTaxBreakdown: boolean;
  showPaymentTerms: boolean;
  showBankDetails: boolean;
  
  // Bank Details
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  swiftCode?: string;
  
  // Terms & Conditions
  termsAndConditions?: string;
  footerText?: string;
  
  // Active Status
  isActive: boolean;
  
  createdBy: mongoose.Types.ObjectId;
}

const InvoiceTemplateSchema = new Schema<IInvoiceTemplate>({
  name: { type: String, required: true },
  description: String,
  isDefault: { type: Boolean, default: false },
  
  logo: String,
  companyName: { type: String, required: true },
  companyAddress: { type: String, required: true },
  companyPhone: String,
  companyEmail: String,
  companyGSTIN: String,
  companyWebsite: String,
  
  layout: { type: String, enum: ['STANDARD', 'MODERN', 'CLASSIC', 'MINIMAL'], default: 'STANDARD' },
  colorScheme: { type: String, default: '#3B82F6' },
  fontSize: { type: Number, default: 12 },
  
  showLineNumbers: { type: Boolean, default: true },
  showTaxBreakdown: { type: Boolean, default: true },
  showPaymentTerms: { type: Boolean, default: true },
  showBankDetails: { type: Boolean, default: true },
  
  bankName: String,
  accountNumber: String,
  ifscCode: String,
  swiftCode: String,
  
  termsAndConditions: String,
  footerText: String,
  
  isActive: { type: Boolean, default: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

export default mongoose.model<IInvoiceTemplate>('InvoiceTemplate', InvoiceTemplateSchema);
