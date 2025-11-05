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
  status: 'active' | 'completed' | 'planned';
  createdAt: Date;
  updatedAt: Date;
}

const resourceAllocationSchema = new Schema<IResourceAllocation>({
  employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  allocatedHours: { type: Number, required: true, default: 0 },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  role: { type: String, required: true },
  utilizationRate: { type: Number, min: 0, max: 100, default: 0 },
  availability: {
    monday: { type: Number, default: 8 },
    tuesday: { type: Number, default: 8 },
    wednesday: { type: Number, default: 8 },
    thursday: { type: Number, default: 8 },
    friday: { type: Number, default: 8 },
    saturday: { type: Number, default: 0 },
    sunday: { type: Number, default: 0 }
  },
  leaves: [{
    startDate: Date,
    endDate: Date,
    reason: String
  }],
  skills: [String],
  status: { type: String, enum: ['active', 'completed', 'planned'], default: 'planned' }
}, { timestamps: true });

resourceAllocationSchema.index({ employee: 1, project: 1 });
resourceAllocationSchema.index({ startDate: 1, endDate: 1 });

export default mongoose.model<IResourceAllocation>('ResourceAllocation', resourceAllocationSchema);
