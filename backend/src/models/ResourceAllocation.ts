import mongoose, { Document, Schema } from 'mongoose';

export interface IResourceAllocation extends Document {
  employee: mongoose.Types.ObjectId;
  project: mongoose.Types.ObjectId;
  allocatedHours: number;
  startDate: Date;
  endDate: Date;
  role: string;
  utilizationRate: number;
  availability: {
    monday: number;
    tuesday: number;
    wednesday: number;
    thursday: number;
    friday: number;
    saturday: number;
    sunday: number;
  };
  leaves: {
    startDate: Date;
    endDate: Date;
    reason: string;
  }[];
  skills: string[];
  status: 'active' | 'completed' | 'planned' | 'on_hold';
  priority: 'low' | 'medium' | 'high' | 'critical';
  notes: string;
  billableHours: number;
  actualHours: number;
  createdBy: mongoose.Types.ObjectId;
  lastModifiedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const resourceAllocationSchema = new Schema<IResourceAllocation>({
  employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  allocatedHours: { 
    type: Number, 
    required: true, 
    default: 0,
    min: [0, 'Allocated hours cannot be negative'],
    max: [60, 'Allocated hours cannot exceed 60 per week']
  },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  role: { type: String, required: true, trim: true },
  utilizationRate: { type: Number, min: 0, max: 150, default: 0 },
  availability: {
    monday: { type: Number, default: 8, min: 0, max: 24 },
    tuesday: { type: Number, default: 8, min: 0, max: 24 },
    wednesday: { type: Number, default: 8, min: 0, max: 24 },
    thursday: { type: Number, default: 8, min: 0, max: 24 },
    friday: { type: Number, default: 8, min: 0, max: 24 },
    saturday: { type: Number, default: 0, min: 0, max: 24 },
    sunday: { type: Number, default: 0, min: 0, max: 24 }
  },
  leaves: [{
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    reason: { type: String, required: true, trim: true }
  }],
  skills: [{ type: String, trim: true }],
  status: { 
    type: String, 
    enum: ['active', 'completed', 'planned', 'on_hold'], 
    default: 'planned' 
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  notes: { type: String, trim: true },
  billableHours: { type: Number, default: 0, min: 0 },
  actualHours: { type: Number, default: 0, min: 0 },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  lastModifiedBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Indexes for performance
resourceAllocationSchema.index({ employee: 1, project: 1 });
resourceAllocationSchema.index({ startDate: 1, endDate: 1 });
resourceAllocationSchema.index({ employee: 1, startDate: 1, endDate: 1 });
resourceAllocationSchema.index({ project: 1, status: 1 });
resourceAllocationSchema.index({ status: 1, startDate: 1 });
resourceAllocationSchema.index({ utilizationRate: 1 });

// Validation middleware
resourceAllocationSchema.pre('save', function(next) {
  // Ensure end date is after start date
  if (this.endDate <= this.startDate) {
    next(new Error('End date must be after start date'));
    return;
  }
  
  // Calculate utilization rate if not set
  if (this.allocatedHours && !this.utilizationRate) {
    this.utilizationRate = Math.min(150, (this.allocatedHours / 40) * 100);
  }
  
  next();
});

// Virtual for duration in days
resourceAllocationSchema.virtual('durationDays').get(function() {
  return Math.ceil((this.endDate.getTime() - this.startDate.getTime()) / (1000 * 60 * 60 * 24));
});

// Virtual for weekly hours breakdown
resourceAllocationSchema.virtual('weeklyHours').get(function() {
  const totalDays = Math.ceil((this.endDate.getTime() - this.startDate.getTime()) / (1000 * 60 * 60 * 24));
  const weeks = Math.ceil(totalDays / 7);
  return {
    totalWeeks: weeks,
    hoursPerWeek: this.allocatedHours,
    totalHours: this.allocatedHours * weeks
  };
});

// Method to check for conflicts with other allocations
resourceAllocationSchema.methods.checkConflicts = async function() {
  const ResourceAllocation = this.constructor;
  const conflicts = await ResourceAllocation.find({
    _id: { $ne: this._id },
    employee: this.employee,
    status: { $in: ['active', 'planned'] },
    $or: [
      { startDate: { $lte: this.endDate }, endDate: { $gte: this.startDate } }
    ]
  });
  
  return conflicts;
};

// Method to calculate total allocation for employee in date range
resourceAllocationSchema.statics.getTotalAllocation = async function(employeeId, startDate, endDate, excludeId = null) {
  const filter: any = {
    employee: employeeId,
    status: { $in: ['active', 'planned'] },
    $or: [
      { startDate: { $lte: endDate }, endDate: { $gte: startDate } }
    ]
  };
  
  if (excludeId) {
    filter._id = { $ne: excludeId };
  }
  
  const allocations = await this.find(filter);
  return allocations.reduce((total, alloc) => total + alloc.allocatedHours, 0);
};

// Ensure virtuals are included in JSON output
resourceAllocationSchema.set('toJSON', { virtuals: true });
resourceAllocationSchema.set('toObject', { virtuals: true });

export default mongoose.model<IResourceAllocation>('ResourceAllocation', resourceAllocationSchema);
