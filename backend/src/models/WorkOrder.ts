import mongoose, { Document, Schema } from 'mongoose';

export interface IWorkOrderPayment {
  amount: number;
  paymentDate: Date;
  paymentReference?: string;
  paymentMethod?: 'bank-transfer' | 'cheque' | 'cash' | 'upi' | 'other';
  notes?: string;
  recordedBy: mongoose.Types.ObjectId;
}

export interface IWorkOrderItem {
  description: string;
  unit: string;
  quantity: number;
  unitRate: number;
  amount: number;
  boqItemId?: mongoose.Types.ObjectId;
}

export interface IWorkOrder extends Document {
  woNumber: string;
  project: mongoose.Types.ObjectId;
  subcontractor: mongoose.Types.ObjectId;
  subcontractorName: string;
  boq?: mongoose.Types.ObjectId;

  title: string;
  description?: string;
  items: IWorkOrderItem[];

  totalAmount: number;
  totalPaid: number;
  totalOutstanding: number;
  retentionPercentage: number;
  retentionAmount: number;
  currency: string;

  startDate?: Date;
  endDate?: Date;
  paymentTerms?: string;

  status: 'draft' | 'pending-approval' | 'approved' | 'issued' | 'in-progress' | 'completed' | 'closed' | 'cancelled';
  approvalStatus: 'pending' | 'approved' | 'rejected';
  approvedBy?: mongoose.Types.ObjectId;
  approvedDate?: Date;
  rejectionReason?: string;

  payments: IWorkOrderPayment[];
  notes?: string;
  attachments?: string[];

  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const workOrderItemSchema = new Schema({
  description: { type: String, required: true },
  unit: { type: String, required: true, trim: true },
  quantity: { type: Number, required: true, min: 0 },
  unitRate: { type: Number, required: true, min: 0 },
  amount: { type: Number, required: true, min: 0 },
  boqItemId: { type: Schema.Types.ObjectId }
}, { _id: true });

const workOrderPaymentSchema = new Schema({
  amount: { type: Number, required: true, min: 0 },
  paymentDate: { type: Date, required: true },
  paymentReference: String,
  paymentMethod: {
    type: String,
    enum: ['bank-transfer', 'cheque', 'cash', 'upi', 'other'],
    default: 'bank-transfer'
  },
  notes: String,
  recordedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { _id: true, timestamps: true });

const workOrderSchema = new Schema<IWorkOrder>({
  woNumber: { type: String, required: true, unique: true, trim: true },
  project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  subcontractor: { type: Schema.Types.ObjectId, ref: 'Contact', required: true },
  subcontractorName: { type: String, required: true },
  boq: { type: Schema.Types.ObjectId, ref: 'BOQ' },

  title: { type: String, required: true, trim: true },
  description: String,
  items: [workOrderItemSchema],

  totalAmount: { type: Number, required: true, min: 0 },
  totalPaid: { type: Number, default: 0, min: 0 },
  totalOutstanding: { type: Number, default: 0, min: 0 },
  retentionPercentage: { type: Number, default: 0, min: 0, max: 100 },
  retentionAmount: { type: Number, default: 0, min: 0 },
  currency: { type: String, default: 'INR', trim: true, uppercase: true, required: true },

  startDate: Date,
  endDate: Date,
  paymentTerms: String,

  status: {
    type: String,
    enum: ['draft', 'pending-approval', 'approved', 'issued', 'in-progress', 'completed', 'closed', 'cancelled'],
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

  payments: [workOrderPaymentSchema],
  notes: String,
  attachments: [String],

  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

workOrderSchema.index({ project: 1, status: 1 });
workOrderSchema.index({ subcontractor: 1 });
workOrderSchema.index({ woNumber: 1 });
workOrderSchema.index({ createdAt: -1 });

workOrderSchema.pre('save', function (next) {
  this.totalOutstanding = this.totalAmount - this.totalPaid;
  if (this.retentionPercentage > 0) {
    this.retentionAmount = (this.totalAmount * this.retentionPercentage) / 100;
  }
  next();
});

export default mongoose.model<IWorkOrder>('WorkOrder', workOrderSchema);
