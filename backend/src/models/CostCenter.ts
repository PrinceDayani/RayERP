import mongoose, { Document, Schema } from 'mongoose';

export interface ICostCenter extends Document {
  code: string;
  name: string;
  description?: string;
  departmentId?: mongoose.Types.ObjectId;
  projectId?: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CostCenterSchema = new Schema<ICostCenter>({
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true
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
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

CostCenterSchema.index({ code: 1 });
CostCenterSchema.index({ isActive: 1 });

export const CostCenter = mongoose.model<ICostCenter>('CostCenter', CostCenterSchema);
