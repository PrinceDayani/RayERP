import mongoose, { Document, Schema } from 'mongoose';

export interface ICostCenter extends Document {
  code: string;
  name: string;
  description?: string;
  departmentId?: mongoose.Types.ObjectId;
  projectId?: mongoose.Types.ObjectId;
  parentId?: mongoose.Types.ObjectId;
  budget: number;
  budgetPeriod: 'monthly' | 'quarterly' | 'yearly';
  budgetVersion: number;
  costType: 'direct' | 'indirect' | 'overhead';
  allocationMethod?: 'equal' | 'percentage' | 'activity_based';
  isActive: boolean;
  level: number;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const CostCenterSchema = new Schema<ICostCenter>({
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  departmentId: {
    type: Schema.Types.ObjectId,
    ref: 'Department'
  },
  projectId: {
    type: Schema.Types.ObjectId,
    ref: 'Project'
  },
  parentId: {
    type: Schema.Types.ObjectId,
    ref: 'CostCenter'
  },
  budget: {
    type: Number,
    default: 0,
    min: 0
  },
  budgetPeriod: {
    type: String,
    enum: ['monthly', 'quarterly', 'yearly'],
    default: 'yearly'
  },
  budgetVersion: {
    type: Number,
    default: 1
  },
  costType: {
    type: String,
    enum: ['direct', 'indirect', 'overhead'],
    default: 'direct'
  },
  allocationMethod: {
    type: String,
    enum: ['equal', 'percentage', 'activity_based']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  level: {
    type: Number,
    default: 0
  },
  metadata: {
    type: Schema.Types.Mixed
  }
}, {
  timestamps: true
});

CostCenterSchema.index({ code: 1 });
CostCenterSchema.index({ isActive: 1 });
CostCenterSchema.index({ departmentId: 1 });
CostCenterSchema.index({ projectId: 1 });
CostCenterSchema.index({ parentId: 1 });

export const CostCenter = mongoose.model<ICostCenter>('CostCenter', CostCenterSchema);

// Cost Allocation Model
export interface ICostAllocation extends Document {
  sourceCostCenterId: mongoose.Types.ObjectId;
  allocationRules: Array<{
    targetCostCenterId: mongoose.Types.ObjectId;
    percentage: number;
    basis?: string;
  }>;
  amount: number;
  description: string;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: Date;
}

const CostAllocationSchema = new Schema<ICostAllocation>({
  sourceCostCenterId: {
    type: Schema.Types.ObjectId,
    ref: 'CostCenter',
    required: true
  },
  allocationRules: [{
    targetCostCenterId: {
      type: Schema.Types.ObjectId,
      ref: 'CostCenter',
      required: true
    },
    percentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    basis: String
  }],
  amount: {
    type: Number,
    required: true
  },
  description: String,
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled'],
    default: 'pending'
  }
}, { timestamps: true });

export const CostAllocation = mongoose.model<ICostAllocation>('CostAllocation', CostAllocationSchema);
