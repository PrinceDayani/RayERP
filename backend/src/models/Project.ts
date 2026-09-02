//path: backend/src/models/Project.ts

import mongoose, { Document, Schema } from 'mongoose';

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

export interface ISiteLocation {
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
}

/**
 * The schedule and value the project was awarded on, captured once so slippage
 * stays measurable after startDate/endDate/budget are revised in flight. On a
 * tender-derived project this is the tender position; otherwise it is whatever
 * the project was first planned at.
 */
export interface IProjectBaseline {
  startDate?: Date;
  endDate?: Date;
  contractValue?: number;
  manHours?: number;
  source: 'tender' | 'manual';
  capturedAt: Date;
}

/**
 * Denormalized man-hour rollup. `planned` sums task estimates and resource
 * allocations; `actual` sums logged task time, daily-report hours and
 * project-attributed attendance. Recomputed by rollUpProjectManHours.
 */
export interface IProjectManHours {
  planned: number;
  actual: number;
  lastCalculatedAt?: Date;
}

export const PROJECT_CATEGORIES = [
  'construction',
  'infrastructure',
  'consultancy',
  'design',
  'supply',
  'maintenance',
  'software',
  'research',
  'other'
] as const;

export type ProjectCategory = (typeof PROJECT_CATEGORIES)[number];

export interface IProject extends Document {
  name: string;
  // Human-facing job number, unique across the register. Generated on create
  // when the caller does not supply one.
  jobNumber?: string;
  description: string;
  projectType: 'instruction' | 'reporting';
  // Business classification of the work, distinct from projectType (which is a
  // progress-tracking mode).
  projectCategory: ProjectCategory;
  status: 'planning' | 'active' | 'on-hold' | 'completed' | 'archived' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  startDate: Date;
  endDate: Date;
  actualStartDate?: Date;
  actualEndDate?: Date;
  baseline?: IProjectBaseline;
  budget: number;
  spentBudget: number;
  currency: string;
  progress: number;
  autoCalculateProgress: boolean;

  // Reporting-based project fields
  progressMode: 'task-based' | 'financial' | 'phase-based';
  financialProgress: IFinancialProgress;
  manHours: IProjectManHours;

  managers: mongoose.Types.ObjectId[];
  team: mongoose.Types.ObjectId[];
  owner: mongoose.Types.ObjectId;
  departments: mongoose.Types.ObjectId[];
  // Free-text client name, kept for records that predate clientContact and for
  // clients that were never added to the contact book.
  client?: string;
  clientContact?: mongoose.Types.ObjectId;
  siteLocation?: ISiteLocation;
  tags: string[];
  
  risks: IRisk[];
  dependencies: mongoose.Types.ObjectId[];
  template?: string;
  
  requiredSkills: IRequiredSkill[];
  instructions: IInstruction[];
  
  activeBOQ?: mongoose.Types.ObjectId;
  // The tender this project was awarded from. Tender.project is the forward
  // link; this is the reverse, so a project can reach its bid position.
  tender?: mongoose.Types.ObjectId;

  // Workflow integration
  workflowInstanceId?: mongoose.Types.ObjectId;
  workflowStatus?: 'active' | 'completed' | 'rejected' | 'cancelled' | 'on-hold' | null;

  // Soft delete. Distinct from the 'archived' status, which is a workflow
  // state a user sets deliberately.
  deletedAt?: Date | null;
  deletedBy?: mongoose.Types.ObjectId | null;

  createdAt: Date;
  updatedAt: Date;
}

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

const siteLocationSchema = new Schema({
  address: { type: String, trim: true },
  city: { type: String, trim: true },
  state: { type: String, trim: true },
  pincode: { type: String, trim: true },
  country: { type: String, trim: true }
}, { _id: false });

const baselineSchema = new Schema({
  startDate: Date,
  endDate: Date,
  contractValue: { type: Number, min: 0 },
  manHours: { type: Number, min: 0 },
  source: { type: String, enum: ['tender', 'manual'], default: 'manual' },
  capturedAt: { type: Date, default: Date.now }
}, { _id: false });

const manHoursSchema = new Schema({
  planned: { type: Number, default: 0, min: 0 },
  actual: { type: Number, default: 0, min: 0 },
  lastCalculatedAt: Date
}, { _id: false });

const projectSchema = new Schema<IProject>({
  name: { type: String, required: true },
  jobNumber: { type: String, trim: true, uppercase: true },
  description: { type: String, required: true },
  projectType: {
    type: String,
    enum: ['instruction', 'reporting'],
    default: 'instruction'
  },
  projectCategory: {
    type: String,
    enum: PROJECT_CATEGORIES,
    default: 'other'
  },
  status: {
    type: String,
    enum: ['planning', 'active', 'on-hold', 'completed', 'archived', 'cancelled'],
    default: 'planning'
  },
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'critical'], 
    default: 'medium' 
  },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  actualStartDate: Date,
  actualEndDate: Date,
  baseline: { type: baselineSchema, default: undefined },
  budget: { type: Number, required: true, default: 0 },
  spentBudget: { type: Number, default: 0 },
  currency: { type: String, default: 'USD', trim: true, uppercase: true, required: true },

  progress: { type: Number, min: 0, max: 100, default: 0 },
  autoCalculateProgress: { type: Boolean, default: true },

  // Reporting-based project fields
  progressMode: {
    type: String,
    enum: ['task-based', 'financial', 'phase-based'],
    default: 'task-based'
  },
  financialProgress: { type: financialProgressSchema, default: () => ({}) },
  manHours: { type: manHoursSchema, default: () => ({}) },
  managers: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
  team: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  departments: [{ type: Schema.Types.ObjectId, ref: 'Department' }],
  client: String,
  clientContact: { type: Schema.Types.ObjectId, ref: 'Contact' },
  siteLocation: { type: siteLocationSchema, default: undefined },
  tags: [String],
  
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
  tender: { type: Schema.Types.ObjectId, ref: 'Tender' },

  // Workflow integration
  workflowInstanceId: { type: Schema.Types.ObjectId, ref: 'WorkflowInstance' },
  workflowStatus: {
    type: String,
    enum: ['active', 'completed', 'rejected', 'cancelled', 'on-hold', null],
    default: null
  },

  deletedAt: { type: Date, default: null },
  deletedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null }
}, { timestamps: true });

// Soft-deleted projects are excluded from every query by default. Project is
// read from dozens of controllers, so this is enforced at the schema rather
// than at each call site. Pass { includeDeleted: true } as a query option to
// opt out (restore flows, admin tooling, migrations).
const softDeleteFilter = function (this: any, next: () => void) {
  if (this.getOptions?.().includeDeleted) return next();
  if (this.getFilter()?.deletedAt === undefined) {
    this.where({ deletedAt: null });
  }
  next();
};

projectSchema.pre(/^find/, softDeleteFilter);
projectSchema.pre(/^count/, softDeleteFilter);
projectSchema.pre('distinct', softDeleteFilter);
projectSchema.pre(/^update/, softDeleteFilter);

// Aggregations bypass query middleware, so the same exclusion is prepended
// to the pipeline unless it already filters on deletedAt.
projectSchema.pre('aggregate', function (next) {
  const pipeline = this.pipeline() as any[];
  const alreadyFiltered = pipeline.some(
    stage => stage?.$match && Object.prototype.hasOwnProperty.call(stage.$match, 'deletedAt')
  );
  if (!alreadyFiltered) {
    pipeline.unshift({ $match: { deletedAt: null } });
  }
  next();
});

// Sparse so the projects that predate the job register do not collide on null.
projectSchema.index({ jobNumber: 1 }, { unique: true, sparse: true });
projectSchema.index({ clientContact: 1, status: 1 });
projectSchema.index({ projectCategory: 1, status: 1 });
projectSchema.index({ tender: 1 });
projectSchema.index({ 'siteLocation.city': 1 });
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
// Every default query now carries a deletedAt predicate.
projectSchema.index({ deletedAt: 1, status: 1 });
projectSchema.index({ deletedAt: 1, updatedAt: -1 });

export default mongoose.model<IProject>('Project', projectSchema);