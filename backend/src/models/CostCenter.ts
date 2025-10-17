import mongoose, { Document, Schema } from 'mongoose';

export interface ICostCenter extends Document {
  code: string;
  name: string;
  type: 'project' | 'department' | 'site' | 'activity';
  parentId?: mongoose.Types.ObjectId;
  projectId?: mongoose.Types.ObjectId;
  manager: mongoose.Types.ObjectId;
  budget: number;
  actualCost: number;
  committedCost: number;
  isActive: boolean;
  description?: string;
  location?: {
    address: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
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
  type: {
    type: String,
    required: true,
    enum: ['project', 'department', 'site', 'activity']
  },
  parentId: {
    type: Schema.Types.ObjectId,
    ref: 'CostCenter'
  },
  projectId: {
    type: Schema.Types.ObjectId,
    ref: 'Project'
  },
  manager: {
    type: Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  budget: {
    type: Number,
    default: 0
  },
  actualCost: {
    type: Number,
    default: 0
  },
  committedCost: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  description: {
    type: String,
    trim: true
  },
  location: {
    address: { type: String, trim: true },
    coordinates: {
      latitude: { type: Number },
      longitude: { type: Number }
    }
  }
}, {
  timestamps: true
});

CostCenterSchema.index({ code: 1 });
CostCenterSchema.index({ type: 1, isActive: 1 });
CostCenterSchema.index({ projectId: 1 });

export const CostCenter = mongoose.model<ICostCenter>('CostCenter', CostCenterSchema);