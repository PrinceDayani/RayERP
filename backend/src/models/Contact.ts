// backend/src/models/Contact.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IContact extends Document {
  name: string;
  email?: string;
  phone: string;
  company?: string;
  position?: string;
  address?: string;
  notes?: string;
  tags?: string[];
  reference?: string;
  alternativePhone?: string;
  
  // Advanced categorization fields
  contactType: 'company' | 'personal' | 'vendor' | 'client' | 'partner';
  department?: string;
  role?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'inactive' | 'archived';
  
  // Additional contact info
  website?: string;
  linkedIn?: string;
  twitter?: string;
  birthday?: Date;
  anniversary?: Date;
  
  // Business details
  industry?: string;
  companySize?: string;
  annualRevenue?: string;
  
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ContactSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: false },
    phone: { type: String, required: true },
    company: { type: String, required: false },
    position: { type: String, required: false },
    address: { type: String, required: false },
    notes: { type: String, required: false },
    tags: [{ type: String, required: false }],
    reference: { type: String, required: false },
    alternativePhone: { type: String, required: false },
    
    // Advanced categorization fields
    contactType: { 
      type: String, 
      enum: ['company', 'personal', 'vendor', 'client', 'partner'], 
      default: 'personal' 
    },
    department: { type: String, required: false },
    role: { type: String, required: false },
    priority: { 
      type: String, 
      enum: ['low', 'medium', 'high', 'critical'], 
      default: 'medium' 
    },
    status: { 
      type: String, 
      enum: ['active', 'inactive', 'archived'], 
      default: 'active' 
    },
    
    // Additional contact info
    website: { type: String, required: false },
    linkedIn: { type: String, required: false },
    twitter: { type: String, required: false },
    birthday: { type: Date, required: false },
    anniversary: { type: Date, required: false },
    
    // Business details
    industry: { type: String, required: false },
    companySize: { type: String, required: false },
    annualRevenue: { type: String, required: false },
    
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  {
    timestamps: true,
  }
);

// Add indexes for better search and filter performance
ContactSchema.index({ name: 'text', email: 'text', phone: 'text', company: 'text', department: 'text', role: 'text' });
ContactSchema.index({ contactType: 1, status: 1 });
ContactSchema.index({ company: 1, department: 1 });
ContactSchema.index({ priority: 1, status: 1 });
ContactSchema.index({ createdBy: 1, status: 1 });

export default mongoose.model<IContact>('Contact', ContactSchema);