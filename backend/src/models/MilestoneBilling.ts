import mongoose, { Document, Schema } from 'mongoose';

export interface IPaymentSchedule {
  milestoneId: string;
  milestoneName: string;
  dueDate: Date;
  percentage: number;
  amount: number;
  status: 'pending' | 'invoiced' | 'paid' | 'overdue' | 'cancelled';
  invoiceNumber?: string;
  invoiceDate?: Date;
  paymentDate?: Date;
  paymentReference?: string;
  notes?: string;
}

export interface IBillingItem {
  boqItemId: mongoose.Types.ObjectId;
  itemCode: string;
  description: string;
  quantity: number;
  unitRate: number;
  amount: number;
  completionPercentage: number;
}

export interface IPaymentRecord {
  paymentId: string;
  amount: number;
  paymentDate: Date;
  paymentMethod: 'bank_transfer' | 'cheque' | 'cash' | 'online' | 'other';
  paymentReference: string;
  bankAccount?: string;
  reconciled: boolean;
  reconciledDate?: Date;
  journalEntryId?: mongoose.Types.ObjectId;
  notes?: string;
}

export interface IBillingAuditEntry {
  action: 'created' | 'updated' | 'submitted' | 'approved' | 'rejected' | 'invoiced' | 'payment_recorded' | 'cancelled';
  performedBy: mongoose.Types.ObjectId;
  timestamp: Date;
  changes?: any;
  notes?: string;
}

export interface IMilestoneBilling extends Document {
  project: mongoose.Types.ObjectId;
  boq: mongoose.Types.ObjectId;
  milestoneId: string;
  milestoneName: string;
  billingType: 'milestone' | 'progress' | 'time-based' | 'completion';
  
  paymentSchedules: IPaymentSchedule[];
  billingItems: IBillingItem[];
  
  totalContractValue: number;
  totalBilledAmount: number;
  totalPaidAmount: number;
  outstandingAmount: number;
  retentionPercentage: number;
  retentionAmount: number;
  retentionHeld: number;
  retentionReleased: number;
  
  currency: string;
  
  paymentRecords: IPaymentRecord[];
  auditTrail: IBillingAuditEntry[];
  
  status: 'draft' | 'pending-approval' | 'approved' | 'invoiced' | 'paid' | 'cancelled';
  approvalStatus: 'pending' | 'approved' | 'rejected';
  approvedBy?: mongoose.Types.ObjectId;
  approvedDate?: Date;
  rejectionReason?: string;
  approvalLimit?: number;
  requiresMultiLevelApproval: boolean;
  
  invoiceNumber?: string;
  invoiceDate?: Date;
  dueDate?: Date;
  paymentTerms?: string;
  
  journalEntryId?: mongoose.Types.ObjectId;
  retentionAccountId?: mongoose.Types.ObjectId;
  
  notes?: string;
  attachments?: string[];
  
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const paymentRecordSchema = new Schema({
  paymentId: { type: String, required: true },
  amount: { type: Number, required: true, min: 0 },
  paymentDate: { type: Date, required: true },
  paymentMethod: { 
    type: String, 
    enum: ['bank_transfer', 'cheque', 'cash', 'online', 'other'], 
    required: true 
  },
  paymentReference: { type: String, required: true },
  bankAccount: String,
  reconciled: { type: Boolean, default: false },
  reconciledDate: Date,
  journalEntryId: { type: Schema.Types.ObjectId, ref: 'JournalEntry' },
  notes: String
}, { _id: true });

const billingAuditEntrySchema = new Schema({
  action: { 
    type: String, 
    enum: ['created', 'updated', 'submitted', 'approved', 'rejected', 'invoiced', 'payment_recorded', 'cancelled'], 
    required: true 
  },
  performedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  timestamp: { type: Date, default: Date.now, required: true },
  changes: Schema.Types.Mixed,
  notes: String
}, { _id: false });

const paymentScheduleSchema = new Schema({
  milestoneId: { type: String, required: true },
  milestoneName: { type: String, required: true },
  dueDate: { type: Date, required: true },
  percentage: { type: Number, required: true, min: 0, max: 100 },
  amount: { type: Number, required: true, min: 0 },
  status: { 
    type: String, 
    enum: ['pending', 'invoiced', 'paid', 'overdue', 'cancelled'], 
    default: 'pending' 
  },
  invoiceNumber: String,
  invoiceDate: Date,
  paymentDate: Date,
  paymentReference: String,
  notes: String
}, { _id: true });

const billingItemSchema = new Schema({
  boqItemId: { type: Schema.Types.ObjectId, required: true },
  itemCode: { type: String, required: true },
  description: { type: String, required: true },
  quantity: { type: Number, required: true, min: 0 },
  unitRate: { type: Number, required: true, min: 0 },
  amount: { type: Number, required: true, min: 0 },
  completionPercentage: { type: Number, required: true, min: 0, max: 100 }
}, { _id: true });

const milestoneBillingSchema = new Schema<IMilestoneBilling>({
  project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  boq: { type: Schema.Types.ObjectId, ref: 'BOQ', required: true },
  milestoneId: { type: String, required: true },
  milestoneName: { type: String, required: true },
  billingType: { 
    type: String, 
    enum: ['milestone', 'progress', 'time-based', 'completion'], 
    default: 'milestone' 
  },
  
  paymentSchedules: [paymentScheduleSchema],
  billingItems: [billingItemSchema],
  
  totalContractValue: { type: Number, required: true, min: 0 },
  totalBilledAmount: { type: Number, default: 0, min: 0 },
  totalPaidAmount: { type: Number, default: 0, min: 0 },
  outstandingAmount: { type: Number, default: 0, min: 0 },
  retentionPercentage: { type: Number, default: 0, min: 0, max: 100 },
  retentionHeld: { type: Number, default: 0, min: 0 },
  retentionReleased: { type: Number, default: 0, min: 0 },
  
  currency: { type: String, default: 'USD', trim: true, uppercase: true, required: true },
  
  paymentRecords: [paymentRecordSchema],
  auditTrail: [billingAuditEntrySchema],
  
  status: { 
    type: String, 
    enum: ['draft', 'pending-approval', 'approved', 'invoiced', 'paid', 'cancelled'], 
    default: 'draft' 
  },
  approvalStatus: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending' 
  },
  approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  approvedDate: Date,
  rejectionReason: String,
  approvalLimit: { type: Number, default: 0 },
  requiresMultiLevelApproval: { type: Boolean, default: false },
  
  invoiceNumber: String,
  invoiceDate: Date,
  dueDate: Date,
  paymentTerms: String,
  
  journalEntryId: { type: Schema.Types.ObjectId, ref: 'JournalEntry' },
  retentionAccountId: { type: Schema.Types.ObjectId, ref: 'ChartOfAccount' },
  
  notes: String,
  attachments: [String],
  
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

milestoneBillingSchema.index({ project: 1, status: 1 });
milestoneBillingSchema.index({ boq: 1 });
milestoneBillingSchema.index({ milestoneId: 1 });
milestoneBillingSchema.index({ status: 1, approvalStatus: 1 });
milestoneBillingSchema.index({ invoiceNumber: 1 });
milestoneBillingSchema.index({ createdAt: -1 });

milestoneBillingSchema.pre('save', function(next) {
  this.outstandingAmount = this.totalBilledAmount - this.totalPaidAmount;
  
  if (this.retentionPercentage > 0) {
    this.retentionAmount = (this.totalBilledAmount * this.retentionPercentage) / 100;
    this.retentionHeld = this.retentionAmount - this.retentionReleased;
  }
  
  if (this.isModified('totalBilledAmount') && !this.isNew) {
    const calculatedTotal = this.billingItems.reduce((sum, item) => sum + item.amount, 0);
    if (Math.abs(calculatedTotal - this.totalBilledAmount) > 0.01) {
      return next(new Error(`Total billed amount mismatch: calculated ${calculatedTotal}, stored ${this.totalBilledAmount}`));
    }
  }
  
  next();
});

export default mongoose.model<IMilestoneBilling>('MilestoneBilling', milestoneBillingSchema);
