import mongoose, { Document, Schema } from 'mongoose';

// --- Workflow Step Types ---
export type StepType = 
  | 'approval'      // Requires approval from designated approvers
  | 'task'          // Creates/assigns a task
  | 'notification'  // Sends notification to users/roles
  | 'condition'     // Conditional branching (if/else)
  | 'parallel'      // Parallel execution of multiple branches
  | 'timer'         // Wait for a duration or until a date
  | 'webhook'       // External system integration
  | 'auto-action';  // Automated action (status change, field update)

export type TriggerType = 
  | 'manual'            // User manually starts
  | 'entity-created'   // When an entity is created
  | 'entity-updated'   // When an entity field changes
  | 'status-changed'   // When entity status changes
  | 'amount-threshold' // When amount exceeds threshold
  | 'date-triggered'   // On a specific date/schedule
  | 'approval-completed'; // When an approval is completed

export type EntityType = 
  | 'project'
  | 'task'
  | 'work-order'
  | 'purchase-order'
  | 'boq'
  | 'invoice'
  | 'payment'
  | 'expense'
  | 'leave'
  | 'journal-entry'
  | 'voucher'
  | 'budget'
  | 'delivery-note'
  | 'bill'
  | 'tender';

// --- Interfaces ---
export interface ICondition {
  field: string;
  operator: 'equals' | 'not-equals' | 'greater-than' | 'less-than' | 'contains' | 'in' | 'not-in';
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

export interface IStepAction {
  type: 'update-field' | 'create-entity' | 'send-notification' | 'assign-user' | 'change-status' | 'trigger-workflow';
  config: Record<string, any>;
}

export interface IWorkflowStep {
  stepId: string;
  name: string;
  description?: string;
  type: StepType;
  order: number;
  
  // Approval step config
  approverType?: 'user' | 'role' | 'department-head' | 'project-manager' | 'dynamic';
  approverIds?: mongoose.Types.ObjectId[];
  approverRoles?: string[];
  approvalMode?: 'any' | 'all' | 'majority'; // any one, all, or majority must approve
  
  // Task step config
  taskConfig?: {
    title: string;
    description?: string;
    assigneeType: 'user' | 'role' | 'dynamic';
    assigneeIds?: mongoose.Types.ObjectId[];
    assigneeRoles?: string[];
    dueInDays?: number;
    priority?: 'low' | 'medium' | 'high' | 'critical';
  };

  // Condition step config
  conditions?: ICondition[];
  trueBranch?: string;  // stepId to go to if true
  falseBranch?: string; // stepId to go to if false

  // Timer step config
  timerConfig?: {
    type: 'duration' | 'date-field';
    durationHours?: number;
    dateField?: string;
  };

  // Auto-action config
  actions?: IStepAction[];

  // Notification config
  notificationConfig?: {
    recipients: 'initiator' | 'approvers' | 'team' | 'custom';
    customRecipientIds?: mongoose.Types.ObjectId[];
    customRecipientRoles?: string[];
    template: string;
    channels: ('in-app' | 'email' | 'sms')[];
  };

  // Escalation
  escalation?: {
    enabled: boolean;
    afterHours: number;
    escalateTo: 'next-level' | 'department-head' | 'admin';
    maxEscalations: number;
  };

  // SLA
  sla?: {
    expectedHours: number;
    warningHours: number;
  };

  // Next step(s)
  nextSteps?: string[]; // stepIds - supports branching
  isTerminal?: boolean;
}

export interface ITriggerConfig {
  type: TriggerType;
  entityType?: EntityType;
  conditions?: ICondition[];
  statusFrom?: string;
  statusTo?: string;
  amountThreshold?: number;
  schedule?: string; // cron expression for date-triggered
}

export interface IWorkflowTemplate extends Document {
  name: string;
  description?: string;
  category: 'procurement' | 'finance' | 'project' | 'hr' | 'operations' | 'custom';
  entityType: EntityType;
  version: number;
  isActive: boolean;
  isDefault: boolean; // Default workflow for this entity type
  
  trigger: ITriggerConfig;
  steps: IWorkflowStep[];
  
  // Access control
  departments?: mongoose.Types.ObjectId[];
  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  
  // Metadata
  tags?: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedDurationHours?: number;
  
  createdAt: Date;
  updatedAt: Date;
}

// --- Schemas ---
const conditionSchema = new Schema({
  field: { type: String, required: true },
  operator: { 
    type: String, 
    enum: ['equals', 'not-equals', 'greater-than', 'less-than', 'contains', 'in', 'not-in'],
    required: true 
  },
  value: { type: Schema.Types.Mixed, required: true },
  logicalOperator: { type: String, enum: ['AND', 'OR'] }
}, { _id: false });

const stepActionSchema = new Schema({
  type: { 
    type: String, 
    enum: ['update-field', 'create-entity', 'send-notification', 'assign-user', 'change-status', 'trigger-workflow'],
    required: true 
  },
  config: { type: Schema.Types.Mixed, required: true }
}, { _id: false });

const workflowStepSchema = new Schema({
  stepId: { type: String, required: true },
  name: { type: String, required: true },
  description: String,
  type: { 
    type: String, 
    enum: ['approval', 'task', 'notification', 'condition', 'parallel', 'timer', 'webhook', 'auto-action'],
    required: true 
  },
  order: { type: Number, required: true },
  
  // Approval config
  approverType: { type: String, enum: ['user', 'role', 'department-head', 'project-manager', 'dynamic'] },
  approverIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  approverRoles: [String],
  approvalMode: { type: String, enum: ['any', 'all', 'majority'], default: 'any' },
  
  // Task config
  taskConfig: {
    title: String,
    description: String,
    assigneeType: { type: String, enum: ['user', 'role', 'dynamic'] },
    assigneeIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    assigneeRoles: [String],
    dueInDays: Number,
    priority: { type: String, enum: ['low', 'medium', 'high', 'critical'] }
  },

  // Condition config
  conditions: [conditionSchema],
  trueBranch: String,
  falseBranch: String,

  // Timer config
  timerConfig: {
    type: { type: String, enum: ['duration', 'date-field'] },
    durationHours: Number,
    dateField: String
  },

  // Auto-action config
  actions: [stepActionSchema],

  // Notification config
  notificationConfig: {
    recipients: { type: String, enum: ['initiator', 'approvers', 'team', 'custom'] },
    customRecipientIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    customRecipientRoles: [String],
    template: String,
    channels: [{ type: String, enum: ['in-app', 'email', 'sms'] }]
  },

  // Escalation
  escalation: {
    enabled: { type: Boolean, default: false },
    afterHours: Number,
    escalateTo: { type: String, enum: ['next-level', 'department-head', 'admin'] },
    maxEscalations: { type: Number, default: 3 }
  },

  // SLA
  sla: {
    expectedHours: Number,
    warningHours: Number
  },

  nextSteps: [String],
  isTerminal: { type: Boolean, default: false }
}, { _id: false });

const triggerConfigSchema = new Schema({
  type: { 
    type: String, 
    enum: ['manual', 'entity-created', 'entity-updated', 'status-changed', 'amount-threshold', 'date-triggered', 'approval-completed'],
    required: true 
  },
  entityType: { 
    type: String, 
    enum: ['project', 'task', 'work-order', 'purchase-order', 'boq', 'invoice', 'payment', 'expense', 'leave', 'journal-entry', 'voucher', 'budget', 'delivery-note', 'bill']
  },
  conditions: [conditionSchema],
  statusFrom: String,
  statusTo: String,
  amountThreshold: Number,
  schedule: String
}, { _id: false });

const workflowTemplateSchema = new Schema<IWorkflowTemplate>({
  name: { type: String, required: true, trim: true },
  description: String,
  category: { 
    type: String, 
    enum: ['procurement', 'finance', 'project', 'hr', 'operations', 'custom'],
    required: true 
  },
  entityType: { 
    type: String, 
    enum: ['project', 'task', 'work-order', 'purchase-order', 'boq', 'invoice', 'payment', 'expense', 'leave', 'journal-entry', 'voucher', 'budget', 'delivery-note', 'bill'],
    required: true 
  },
  version: { type: Number, default: 1 },
  isActive: { type: Boolean, default: true },
  isDefault: { type: Boolean, default: false },
  
  trigger: { type: triggerConfigSchema, required: true },
  steps: [workflowStepSchema],
  
  departments: [{ type: Schema.Types.ObjectId, ref: 'Department' }],
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  
  tags: [String],
  priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  estimatedDurationHours: Number
}, { timestamps: true });

// Indexes
workflowTemplateSchema.index({ entityType: 1, isActive: 1 });
workflowTemplateSchema.index({ category: 1, isActive: 1 });
workflowTemplateSchema.index({ isDefault: 1, entityType: 1 });
workflowTemplateSchema.index({ departments: 1 });
workflowTemplateSchema.index({ createdBy: 1 });
workflowTemplateSchema.index({ tags: 1 });

export default mongoose.model<IWorkflowTemplate>('WorkflowTemplate', workflowTemplateSchema);
