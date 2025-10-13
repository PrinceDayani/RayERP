//path: backend/src/models/Project.ts

import mongoose, { Document, Schema } from 'mongoose';

export interface IProject extends Document {
  name: string;
  description: string;
  status: 'planning' | 'active' | 'on-hold' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  startDate: Date;
  endDate: Date;
  budget: number;
  spentBudget: number;
  progress: number;
  manager: mongoose.Types.ObjectId;
  team: mongoose.Types.ObjectId[];
  client?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const projectSchema = new Schema<IProject>({
  name: { type: String, required: true },
  description: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['planning', 'active', 'on-hold', 'completed', 'cancelled'], 
    default: 'planning' 
  },
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'critical'], 
    default: 'medium' 
  },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  budget: { type: Number, required: true, default: 0 },
  spentBudget: { type: Number, default: 0 },
  progress: { type: Number, min: 0, max: 100, default: 0 },
  manager: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  team: [{ type: Schema.Types.ObjectId, ref: 'Employee' }],
  client: String,
  tags: [String]
}, { timestamps: true });

export default mongoose.model<IProject>('Project', projectSchema);