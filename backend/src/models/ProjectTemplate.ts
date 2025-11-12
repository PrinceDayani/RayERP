//path: backend/src/models/ProjectTemplate.ts

import mongoose, { Document, Schema } from 'mongoose';

export interface IProjectTemplate extends Document {
  name: string;
  description: string;
  category: 'software' | 'construction' | 'marketing' | 'research' | 'consulting' | 'other';
  isPublic: boolean;
  createdBy: mongoose.Types.ObjectId;
  projectData: {
    name: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    estimatedDuration: number;
    budget: number;
    tags: string[];
  };
  taskTemplates: {
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    estimatedHours: number;
    daysFromStart: number;
    tags: string[];
  }[];
  customFields: {
    name: string;
    type: 'text' | 'number' | 'date' | 'select';
    options?: string[];
    required: boolean;
  }[];
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const projectTemplateSchema = new Schema<IProjectTemplate>({
  name: { type: String, required: true },
  description: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['software', 'construction', 'marketing', 'research', 'consulting', 'other'],
    default: 'other'
  },
  isPublic: { type: Boolean, default: false },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  projectData: {
    name: { type: String, required: true },
    description: { type: String, required: true },
    priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
    estimatedDuration: { type: Number, default: 30 },
    budget: { type: Number, default: 0 },
    tags: [String]
  },
  taskTemplates: [{
    title: { type: String, required: true },
    description: { type: String, required: true },
    priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
    estimatedHours: { type: Number, default: 0 },
    daysFromStart: { type: Number, default: 0 },
    tags: [String]
  }],
  customFields: [{
    name: { type: String, required: true },
    type: { type: String, enum: ['text', 'number', 'date', 'select'], required: true },
    options: [String],
    required: { type: Boolean, default: false }
  }],
  usageCount: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model<IProjectTemplate>('ProjectTemplate', projectTemplateSchema);
