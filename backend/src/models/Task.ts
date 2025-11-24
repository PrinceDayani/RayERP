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
  tags: {
    name: string;
    color: string;
  }[];
  comments: {
    user: mongoose.Types.ObjectId;
    comment: string;
    mentions: mongoose.Types.ObjectId[];
    createdAt: Date;
  }[];
  dependencies: {
    taskId: mongoose.Types.ObjectId;
    type: 'finish-to-start' | 'start-to-start' | 'finish-to-finish' | 'start-to-finish';
  }[];
  subtasks: mongoose.Types.ObjectId[];
  parentTask?: mongoose.Types.ObjectId;
  checklist: {
    text: string;
    completed: boolean;
    completedBy?: mongoose.Types.ObjectId;
    completedAt?: Date;
  }[];
  timeEntries: {
    user: mongoose.Types.ObjectId;
    startTime: Date;
    endTime?: Date;
    duration: number;
    description?: string;
  }[];
  attachments: {
    filename: string;
    originalName: string;
    mimetype: string;
    size: number;
    url: string;
    uploadedBy: mongoose.Types.ObjectId;
    uploadedAt: Date;
  }[];
  customFields: {
    fieldName: string;
    fieldType: 'text' | 'number' | 'date' | 'select' | 'multiselect';
    value: any;
  }[];
  isRecurring: boolean;
  recurrencePattern?: string;
  nextRecurrence?: Date;
  blockedBy?: string;
  watchers: mongoose.Types.ObjectId[];
  isTemplate: boolean;
  templateName?: string;
  reminderSent24h: boolean;
  reminderSentOnDue: boolean;
  reminderSentOverdue: boolean;
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
  tags: [{
    name: { type: String, required: true },
    color: { type: String, default: '#3b82f6' }
  }],
  comments: [{
    user: { type: Schema.Types.ObjectId, ref: 'Employee' },
    comment: String,
    mentions: [{ type: Schema.Types.ObjectId, ref: 'Employee' }],
    createdAt: { type: Date, default: Date.now }
  }],
  checklist: [{
    text: { type: String, required: true },
    completed: { type: Boolean, default: false },
    completedBy: { type: Schema.Types.ObjectId, ref: 'Employee' },
    completedAt: Date
  }],
  timeEntries: [{
    user: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    startTime: { type: Date, required: true },
    endTime: Date,
    duration: { type: Number, default: 0 },
    description: String
  }],
  attachments: [{
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    mimetype: String,
    size: Number,
    url: { type: String, required: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    uploadedAt: { type: Date, default: Date.now }
  }],
  customFields: [{
    fieldName: String,
    fieldType: { type: String, enum: ['text', 'number', 'date', 'select', 'multiselect'] },
    value: Schema.Types.Mixed
  }],
  nextRecurrence: Date,
  reminderSent24h: { type: Boolean, default: false },
  reminderSentOnDue: { type: Boolean, default: false },
  reminderSentOverdue: { type: Boolean, default: false },
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

taskSchema.index({ title: 'text', description: 'text' });
taskSchema.index({ 'tags.name': 1 });
taskSchema.index({ dueDate: 1, status: 1 });
taskSchema.index({ assignedTo: 1, status: 1 });
taskSchema.index({ project: 1, status: 1 });

export default mongoose.model<ITask>('Task', taskSchema);