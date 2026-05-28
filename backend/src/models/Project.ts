//path: backend/src/models/Project.ts

import mongoose, { Document, Schema } from 'mongoose';

export interface IMilestone {
  name: string;
  description?: string;
  dueDate: Date;
  status: 'pending' | 'in-progress' | 'completed' | 'delayed';
  completedDate?: Date;
}

export interface IRisk {
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  probability: 'low' | 'medium' | 'high';
  mitigation?: string;
  status: 'identified' | 'mitigated' | 'resolved';
  identifiedDate: Date;
}

export type SkillLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';

export interface IRequiredSkill {
  skill: string;
  level: SkillLevel;
  priority: 'required' | 'preferred' | 'nice-to-have';
}

export interface IInstruction {
  title: string;
  content: string;
  type: 'general' | 'task' | 'milestone' | 'safety' | 'quality';
  priority: 'low' | 'medium' | 'high';
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IFinancialProgress {
  totalContractValue: number;
  totalPaymentsReceived: number;
  totalPaymentsMade: number;
  financialProgress: number; // percentage based on payments vs budget
  lastUpdated: Date;
  departmentBreakdown: {
    department: mongoose.Types.ObjectId;
    allocated: number;
    spent: number;
    received: number;
  }[];
}

export interface IProject extends Document {
  name: string;
  description: string;
  projectType: 'instruction' | 'reporting';
  status: 'planning' | 'active' | 'on-hold' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  startDate: Date;
  endDate: Date;
  budget: number;
  spentBudget: number;
  currency: string;
  progress: number;
  autoCalculateProgress: boolean;

  // Reporting-based project fields
  progressMode: 'task-based' | 'financial';
  financialProgress: IFinancialProgress;

  managers: mongoose.Types.ObjectId[];
  team: mongoose.Types.ObjectId[];
  owner: mongoose.Types.ObjectId;
  departments: mongoose.Types.ObjectId[];
  client?: string;
  tags: string[];
  
  milestones: IMilestone[];
  risks: IRisk[];
  dependencies: mongoose.Types.ObjectId[];
  template?: string;
  
  requiredSkills: IRequiredSkill[];
  instructions: IInstruction[];
  
  activeBOQ?: mongoose.Types.ObjectId;

  // Workflow integration
  workflowInstanceId?: mongoose.Types.ObjectId;
  workflowStatus?: 'active' | 'completed' | 'rejected' | 'cancelled' | 'on-hold' | null;
  
  createdAt: Date;
  updatedAt: Date;
}

const milestoneSchema = new Schema({
  name: { type: String, required: true },
  description: String,
  dueDate: { type: Date, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'in-progress', 'completed', 'delayed'], 
    default: 'pending' 
  },
  completedDate: Date
}, { _id: true });

const riskSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  severity: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'critical'], 
    required: true 
  },
  probability: { 
    type: String, 
    enum: ['low', 'medium', 'high'], 
    required: true 
  },
  mitigation: String,
  status: { 
    type: String, 
    enum: ['identified', 'mitigated', 'resolved'], 
    default: 'identified' 
  },
  identifiedDate: { type: Date, default: Date.now }
}, { _id: true });

const instructionSchema = new Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['general', 'task', 'milestone', 'safety', 'quality'], 
    default: 'general' 
  },
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high'], 
    default: 'medium' 
  },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { _id: true });

const financialProgressSchema = new Schema({
  totalContractValue: { type: Number, default: 0 },
  totalPaymentsReceived: { type: Number, default: 0 },
  totalPaymentsMade: { type: Number, default: 0 },
  financialProgress: { type: Number, min: 0, max: 100, default: 0 },
  lastUpdated: { type: Date, default: Date.now },
  departmentBreakdown: [{
    department: { type: Schema.Types.ObjectId, ref: 'Department' },
    allocated: { type: Number, default: 0 },
    spent: { type: Number, default: 0 },
    received: { type: Number, default: 0 }
  }]
}, { _id: false });

const projectSchema = new Schema<IProject>({
  name: { type: String, required: true },
  description: { type: String, required: true },
  projectType: {
    type: String,
    enum: ['instruction', 'reporting'],
    default: 'instruction'
  },
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
  currency: { type: String, default: 'USD', trim: true, uppercase: true, required: true },

  progress: { type: Number, min: 0, max: 100, default: 0 },
  autoCalculateProgress: { type: Boolean, default: true },

  // Reporting-based project fields
  progressMode: {
    type: String,
    enum: ['task-based', 'financial'],
    default: 'task-based'
  },
  financialProgress: { type: financialProgressSchema, default: () => ({}) },
  managers: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
  team: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  departments: [{ type: Schema.Types.ObjectId, ref: 'Department' }],
  client: String,
  tags: [String],
  
  milestones: [milestoneSchema],
  risks: [riskSchema],
  dependencies: [{ type: Schema.Types.ObjectId, ref: 'Project' }],
  template: String,
  
  requiredSkills: [{
    skill: { type: String, required: true },
    level: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'], required: true },
    priority: { type: String, enum: ['required', 'preferred', 'nice-to-have'], default: 'required' }
  }],
  instructions: [instructionSchema],
  activeBOQ: { type: Schema.Types.ObjectId, ref: 'BOQ' },

  // Workflow integration
  workflowInstanceId: { type: Schema.Types.ObjectId, ref: 'WorkflowInstance' },
  workflowStatus: { 
    type: String, 
    enum: ['active', 'completed', 'rejected', 'cancelled', 'on-hold', null],
    default: null
  }
}, { timestamps: true });

projectSchema.index({ 'instructions.type': 1 });
projectSchema.index({ 'instructions.priority': 1 });
projectSchema.index({ projectType: 1 });
projectSchema.index({ progressMode: 1 });


// Virtual for backward compatibility
projectSchema.virtual('manager').get(function() {
  return this.managers && this.managers.length > 0 ? this.managers[0] : null;
});

// Performance indexes
projectSchema.index({ owner: 1, status: 1 });
projectSchema.index({ managers: 1, status: 1 });
projectSchema.index({ team: 1, status: 1 });
projectSchema.index({ departments: 1, status: 1 });
projectSchema.index({ status: 1, priority: 1 });
projectSchema.index({ startDate: 1, endDate: 1 });
projectSchema.index({ createdAt: -1 });
projectSchema.index({ updatedAt: -1 });
projectSchema.index({ workflowInstanceId: 1 });
projectSchema.index({ workflowStatus: 1 });

export default mongoose.model<IProject>('Project', projectSchema);