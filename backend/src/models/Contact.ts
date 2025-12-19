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
  
  // Visibility level
  visibilityLevel: 'universal' | 'departmental' | 'personal';
  department?: mongoose.Types.ObjectId;
  
  // Advanced categorization fields
  contactType: 'company' | 'personal' | 'vendor' | 'client' | 'partner';
  role?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'inactive' | 'archived';
  
  // Customer flag
  isCustomer: boolean;
  
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
    
    // Visibility level
    visibilityLevel: {
      type: String,
      enum: ['universal', 'departmental', 'personal'],
      default: 'personal',
      required: true
    },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: false },
    
    // Advanced categorization fields
    contactType: { 
      type: String, 
      enum: ['company', 'personal', 'vendor', 'client', 'partner'], 
      default: 'personal' 
    },
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
    
    // Customer flag
    isCustomer: { type: Boolean, default: false },
    
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  {
    timestamps: true,
  }
);

// Production-ready indexes for optimal performance
// Text search index with weights
ContactSchema.index({ 
  name: 'text', 
  email: 'text', 
  phone: 'text', 
  company: 'text', 
  role: 'text' 
}, {
  weights: { name: 10, email: 5, phone: 8, company: 6, role: 3 },
  name: 'contact_text_search'
});

// Compound indexes for common queries
ContactSchema.index({ visibilityLevel: 1, status: 1, createdBy: 1 });
ContactSchema.index({ visibilityLevel: 1, department: 1, status: 1 });
ContactSchema.index({ contactType: 1, status: 1, priority: 1 });
ContactSchema.index({ isCustomer: 1, status: 1, name: 1 });
ContactSchema.index({ createdBy: 1, status: 1, updatedAt: -1 });

// Single field indexes
ContactSchema.index({ phone: 1 }, { sparse: true });
ContactSchema.index({ email: 1 }, { sparse: true });
ContactSchema.index({ createdAt: -1 });
ContactSchema.index({ updatedAt: -1 });

// Pre-save middleware for data sanitization
ContactSchema.pre('save', function(next) {
  if (this.phone) this.phone = this.phone.replace(/[^+\d]/g, '');
  if (this.email) this.email = this.email.toLowerCase().trim();
  if (this.name) this.name = this.name.trim();
  if (this.visibilityLevel === 'departmental' && !this.department) {
    return next(new Error('Department required for departmental visibility'));
  }
  if (this.visibilityLevel !== 'departmental') this.department = undefined;
  next();
});

// Static methods for common queries
ContactSchema.statics.findCustomers = function(userId?: string, limit = 50) {
  const query: any = { isCustomer: true, status: 'active' };
  if (userId) {
    query.$or = [
      { visibilityLevel: 'universal' },
      { visibilityLevel: 'personal', createdBy: userId }
    ];
  }
  return this.find(query).select('name email phone company').sort({ name: 1 }).limit(limit).lean();
};

export default mongoose.model<IContact>('Contact', ContactSchema);