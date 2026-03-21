import mongoose, { Document, Schema } from 'mongoose';

export interface IBOQItem {
  itemCode: string;
  description: string;
  category: 'material' | 'labor' | 'equipment' | 'subcontractor' | 'other';
  unit: string;
  plannedQuantity: number;
  actualQuantity: number;
  unitRate: number;
  currency: string;
  plannedAmount: number;
  actualAmount: number;
  completionPercentage: number;
  startDate?: Date;
  endDate?: Date;
  status: 'not-started' | 'in-progress' | 'completed' | 'on-hold';
  milestone?: mongoose.Types.ObjectId;
  notes?: string;
  attachments?: string[];
}

export interface IBOQ extends Document {
  project: mongoose.Types.ObjectId;
  version: number;
  status: 'draft' | 'approved' | 'active' | 'revised' | 'closed';
  items: IBOQItem[];
  totalPlannedAmount: number;
  totalActualAmount: number;
  overallProgress: number;
  currency: string;
  approvedBy?: mongoose.Types.ObjectId;
  approvedDate?: Date;
  revisionNotes?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const boqItemSchema = new Schema({
  itemCode: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['material', 'labor', 'equipment', 'subcontractor', 'other'], 
    required: true 
  },
  unit: { type: String, required: true, trim: true },
  plannedQuantity: { type: Number, required: true, min: 0 },
  actualQuantity: { type: Number, default: 0, min: 0 },
  unitRate: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'USD', trim: true, uppercase: true },
  plannedAmount: { type: Number, required: true, min: 0 },
  actualAmount: { type: Number, default: 0, min: 0 },
  completionPercentage: { type: Number, default: 0, min: 0, max: 100 },
  startDate: Date,
  endDate: Date,
  status: { 
    type: String, 
    enum: ['not-started', 'in-progress', 'completed', 'on-hold'], 
    default: 'not-started' 
  },
  milestone: { type: Schema.Types.ObjectId, ref: 'Project.milestones' },
  notes: String,
  attachments: [String]
}, { _id: true });

const boqSchema = new Schema<IBOQ>({
  project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  version: { type: Number, required: true, default: 1 },
  status: { 
    type: String, 
    enum: ['draft', 'approved', 'active', 'revised', 'closed'], 
    default: 'draft' 
  },
  items: [boqItemSchema],
  totalPlannedAmount: { type: Number, default: 0, min: 0 },
  totalActualAmount: { type: Number, default: 0, min: 0 },
  overallProgress: { type: Number, default: 0, min: 0, max: 100 },
  currency: { type: String, default: 'USD', trim: true, uppercase: true, required: true },
  approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  approvedDate: Date,
  revisionNotes: String,
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

boqSchema.index({ project: 1, version: -1 });
boqSchema.index({ status: 1 });
boqSchema.index({ 'items.category': 1 });
boqSchema.index({ 'items.status': 1 });
boqSchema.index({ createdAt: -1 });

boqSchema.pre('save', function(next) {
  if (this.items && this.items.length > 0) {
    this.totalPlannedAmount = this.items.reduce((sum, item) => sum + item.plannedAmount, 0);
    this.totalActualAmount = this.items.reduce((sum, item) => sum + item.actualAmount, 0);
    
    const totalWeight = this.items.reduce((sum, item) => sum + item.plannedAmount, 0);
    if (totalWeight > 0) {
      this.overallProgress = this.items.reduce((sum, item) => 
        sum + (item.completionPercentage * item.plannedAmount / totalWeight), 0
      );
    }
  }
  next();
});

export default mongoose.model<IBOQ>('BOQ', boqSchema);
