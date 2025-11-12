//path: backend/src/models/Task.ts

import mongoose, { Document, Schema } from 'mongoose';

export interface ITask extends Document {
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'review' | 'completed' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'critical';
  project: mongoose.Types.ObjectId;
  assignedTo: mongoose.Types.ObjectId;
  assignedBy: mongoose.Types.ObjectId;
  dueDate: Date;
  estimatedHours: number;
  actualHours: number;
  tags: string[];
  comments: {
    user: mongoose.Types.ObjectId;
    comment: string;
    createdAt: Date;
  }[];
  dependencies: {
    taskId: mongoose.Types.ObjectId;
    type: 'finish-to-start' | 'start-to-start' | 'finish-to-finish' | 'start-to-finish';
  }[];
  subtasks: mongoose.Types.ObjectId[];
  parentTask?: mongoose.Types.ObjectId;
  isRecurring: boolean;
  recurrencePattern?: string;
  blockedBy?: string;
  watchers: mongoose.Types.ObjectId[];
  isTemplate: boolean;
  templateName?: string;
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<ITask>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['todo', 'in-progress', 'review', 'completed', 'blocked'], 
    default: 'todo' 
  },
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'critical'], 
    default: 'medium' 
  },
  project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  assignedTo: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  assignedBy: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  dueDate: { type: Date },
  estimatedHours: { type: Number, default: 0 },
  actualHours: { type: Number, default: 0 },
  tags: [String],
  comments: [{
    user: { type: Schema.Types.ObjectId, ref: 'Employee' },
    comment: String,
    createdAt: { type: Date, default: Date.now }
  }],
  dependencies: [{
    taskId: { type: Schema.Types.ObjectId, ref: 'Task' },
    type: { type: String, enum: ['finish-to-start', 'start-to-start', 'finish-to-finish', 'start-to-finish'] }
  }],
  subtasks: [{ type: Schema.Types.ObjectId, ref: 'Task' }],
  parentTask: { type: Schema.Types.ObjectId, ref: 'Task' },
  isRecurring: { type: Boolean, default: false },
  recurrencePattern: { type: String },
  blockedBy: { type: String },
  watchers: [{ type: Schema.Types.ObjectId, ref: 'Employee' }],
  isTemplate: { type: Boolean, default: false },
  templateName: { type: String }
}, { timestamps: true });

export default mongoose.model<ITask>('Task', taskSchema);