import mongoose, { Document, Schema } from 'mongoose';
import { EntityType } from './WorkflowTemplate';

// --- Step Execution Status ---
export type StepStatus = 
  | 'pending'
  | 'active'
  | 'completed'
  | 'rejected'
  | 'skipped'
  | 'escalated'
  | 'timed-out'
  | 'cancelled';

export type InstanceStatus = 
  | 'active'
  | 'completed'
  | 'rejected'
  | 'cancelled'
  | 'on-hold'
  | 'error';

// --- Interfaces ---
export interface IStepApproval {
  userId: mongoose.Types.ObjectId;
  action: 'approved' | 'rejected' | 'delegated';
  comments?: string;
  delegatedTo?: mongoose.Types.ObjectId;
  timestamp: Date;
}

export interface IStepExecution {
  stepId: string;
  stepName: string;
  stepType: string;
  status: StepStatus;
  
  // Timing
  startedAt?: Date;
  completedAt?: Date;
  dueAt?: Date;
  
  // Approval tracking
  approvals?: IStepApproval[];
  requiredApprovals?: number;
  receivedApprovals?: number;
  
  // Task tracking
  assignedTo?: mongoose.Types.ObjectId[];
  taskId?: mongoose.Types.ObjectId;
  
  // Escalation tracking
  escalationLevel?: number;
  escalatedAt?: Date;
  escalatedTo?: mongoose.Types.ObjectId;
  
  // Result
  result?: 'approved' | 'rejected' | 'completed' | 'timed-out';
  resultData?: Record<string, any>;
  comments?: string;
  
  // SLA tracking
  slaBreached?: boolean;
  slaWarningAt?: Date;
}

export interface IWorkflowComment {
  userId: mongoose.Types.ObjectId;
  stepId?: string;
  comment: string;
  attachments?: string[];
  timestamp: Date;
}

export interface IWorkflowAuditEntry {
  action: string;
  performedBy: mongoose.Types.ObjectId;
  stepId?: string;
  details?: Record<string, any>;
  timestamp: Date;
}

export interface IWorkflowInstance extends Document {
  templateId: mongoose.Types.ObjectId;
  templateName: string;
  templateVersion: number;
  
  // Entity reference
  entityType: EntityType;
  entityId: mongoose.Types.ObjectId;
  entityTitle: string;
  
  // Project context (for infra workflows)
  projectId?: mongoose.Types.ObjectId;
  departmentId?: mongoose.Types.ObjectId;
  
  // Status
  status: InstanceStatus;
  currentStepId: string;
  currentStepName: string;
  progress: number; // 0-100
  
  // Execution
  steps: IStepExecution[];
  
  // People
  initiatedBy: mongoose.Types.ObjectId;
  currentAssignees: mongoose.Types.ObjectId[];
  participants: mongoose.Types.ObjectId[]; // All users who participated
  
  // Priority & SLA
  priority: 'low' | 'medium' | 'high' | 'critical';
  dueDate?: Date;
  slaBreached: boolean;
  
  // Metadata
  metadata?: Record<string, any>;
  comments: IWorkflowComment[];
  auditTrail: IWorkflowAuditEntry[];
  tags?: string[];
  
  // Timing
  startedAt: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  cancelledBy?: mongoose.Types.ObjectId;
  cancellationReason?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

// --- Schemas ---
const stepApprovalSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, enum: ['approved', 'rejected', 'delegated'], required: true },
  comments: String,
  delegatedTo: { type: Schema.Types.ObjectId, ref: 'User' },
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const stepExecutionSchema = new Schema({
  stepId: { type: String, required: true },
  stepName: { type: String, required: true },
  stepType: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'active', 'completed', 'rejected', 'skipped', 'escalated', 'timed-out', 'cancelled'],
    default: 'pending'
  },
  
  startedAt: Date,
  completedAt: Date,
  dueAt: Date,
  
  approvals: [stepApprovalSchema],
  requiredApprovals: Number,
  receivedApprovals: { type: Number, default: 0 },
  
  assignedTo: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  taskId: { type: Schema.Types.ObjectId, ref: 'Task' },
  
  escalationLevel: { type: Number, default: 0 },
  escalatedAt: Date,
  escalatedTo: { type: Schema.Types.ObjectId, ref: 'User' },
  
  result: { type: String, enum: ['approved', 'rejected', 'completed', 'timed-out'] },
  resultData: Schema.Types.Mixed,
  comments: String,
  
  slaBreached: { type: Boolean, default: false },
  slaWarningAt: Date
}, { _id: false });

const workflowCommentSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  stepId: String,
  comment: { type: String, required: true },
  attachments: [String],
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const workflowAuditSchema = new Schema({
  action: { type: String, required: true },
  performedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  stepId: String,
  details: Schema.Types.Mixed,
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const workflowInstanceSchema = new Schema<IWorkflowInstance>({
  templateId: { type: Schema.Types.ObjectId, ref: 'WorkflowTemplate', required: true },
  templateName: { type: String, required: true },
  templateVersion: { type: Number, required: true },
  
  entityType: { 
    type: String, 
    enum: ['project', 'task', 'work-order', 'purchase-order', 'boq', 'invoice', 'payment', 'expense', 'leave', 'journal-entry', 'voucher', 'budget', 'delivery-note', 'bill'],
    required: true 
  },
  entityId: { type: Schema.Types.ObjectId, required: true },
  entityTitle: { type: String, required: true },
  
  projectId: { type: Schema.Types.ObjectId, ref: 'Project' },
  departmentId: { type: Schema.Types.ObjectId, ref: 'Department' },
  
  status: { 
    type: String, 
    enum: ['active', 'completed', 'rejected', 'cancelled', 'on-hold', 'error'],
    default: 'active'
  },
  currentStepId: { type: String, required: true },
  currentStepName: { type: String, required: true },
  progress: { type: Number, min: 0, max: 100, default: 0 },
  
  steps: [stepExecutionSchema],
  
  initiatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  currentAssignees: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  participants: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  
  priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  dueDate: Date,
  slaBreached: { type: Boolean, default: false },
  
  metadata: Schema.Types.Mixed,
  comments: [workflowCommentSchema],
  auditTrail: [workflowAuditSchema],
  tags: [String],
  
  startedAt: { type: Date, default: Date.now },
  completedAt: Date,
  cancelledAt: Date,
  cancelledBy: { type: Schema.Types.ObjectId, ref: 'User' },
  cancellationReason: String
}, { timestamps: true });

// Indexes for performance
workflowInstanceSchema.index({ status: 1, priority: -1 });
workflowInstanceSchema.index({ entityType: 1, entityId: 1 });
workflowInstanceSchema.index({ templateId: 1, status: 1 });
workflowInstanceSchema.index({ initiatedBy: 1, status: 1 });
workflowInstanceSchema.index({ currentAssignees: 1, status: 1 });
workflowInstanceSchema.index({ projectId: 1, status: 1 });
workflowInstanceSchema.index({ departmentId: 1, status: 1 });
workflowInstanceSchema.index({ startedAt: -1 });
workflowInstanceSchema.index({ dueDate: 1, slaBreached: 1 });
workflowInstanceSchema.index({ 'steps.stepId': 1, 'steps.status': 1 });
workflowInstanceSchema.index({ participants: 1 });

export default mongoose.model<IWorkflowInstance>('WorkflowInstance', workflowInstanceSchema);
