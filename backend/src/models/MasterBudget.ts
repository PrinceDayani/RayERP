import mongoose, { Document, Schema } from 'mongoose';

export interface IMasterBudgetAllocation {
  departmentId?: mongoose.Types.ObjectId;
  departmentName: string;
  allocatedAmount: number;
  utilizedAmount: number;
  remainingAmount: number;
}

export interface IMasterBudget extends Document {
  fiscalYear: number;
  fiscalPeriod: string;
  totalBudget: number;
  totalAllocated: number;
  totalUtilized: number;
  remainingBudget: number;
  currency: string;
  status: 'draft' | 'approved' | 'active' | 'closed';
  allocations: IMasterBudgetAllocation[];
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const masterBudgetAllocationSchema = new Schema<IMasterBudgetAllocation>({
  departmentId: { type: Schema.Types.ObjectId, ref: 'Department' },
  departmentName: { type: String, required: true },
  allocatedAmount: { type: Number, required: true, min: 0 },
  utilizedAmount: { type: Number, default: 0, min: 0 },
  remainingAmount: { type: Number, default: 0 }
});

const masterBudgetSchema = new Schema<IMasterBudget>({
  fiscalYear: { type: Number, required: true },
  fiscalPeriod: { type: String, required: true },
  totalBudget: { type: Number, required: true, min: 0 },
  totalAllocated: { type: Number, default: 0, min: 0 },
  totalUtilized: { type: Number, default: 0, min: 0 },
  remainingBudget: { type: Number, default: 0 },
  currency: { type: String, default: 'USD' },
  status: { 
    type: String, 
    enum: ['draft', 'approved', 'active', 'closed'], 
    default: 'draft' 
  },
  allocations: [masterBudgetAllocationSchema],
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Pre-save calculations
masterBudgetSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  if (this.allocations && this.allocations.length > 0) {
    this.totalAllocated = this.allocations.reduce((sum, alloc) => sum + alloc.allocatedAmount, 0);
    this.totalUtilized = this.allocations.reduce((sum, alloc) => sum + alloc.utilizedAmount, 0);
    this.remainingBudget = this.totalBudget - this.totalUtilized;
    
    // Update remaining amounts for each allocation
    this.allocations.forEach(alloc => {
      alloc.remainingAmount = alloc.allocatedAmount - alloc.utilizedAmount;
    });
  }
  
  next();
});

// Indexes
masterBudgetSchema.index({ fiscalYear: 1, fiscalPeriod: 1 }, { unique: true });
masterBudgetSchema.index({ status: 1 });

// Virtuals
masterBudgetSchema.virtual('utilizationPercentage').get(function() {
  return this.totalBudget > 0 ? (this.totalUtilized / this.totalBudget) * 100 : 0;
});

masterBudgetSchema.virtual('allocationPercentage').get(function() {
  return this.totalBudget > 0 ? (this.totalAllocated / this.totalBudget) * 100 : 0;
});

export default mongoose.model<IMasterBudget>('MasterBudget', masterBudgetSchema);