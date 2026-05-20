// path: frontend/src/lib/api/workflowsAPI.ts
import api from './api';

// ==========================================
// TYPES
// ==========================================

export type StepType = 'approval' | 'task' | 'notification' | 'condition' | 'parallel' | 'timer' | 'webhook' | 'auto-action';
export type EntityType = 'project' | 'task' | 'work-order' | 'purchase-order' | 'boq' | 'invoice' | 'payment' | 'expense' | 'leave' | 'journal-entry' | 'voucher' | 'budget' | 'delivery-note' | 'bill';
export type InstanceStatus = 'active' | 'completed' | 'rejected' | 'cancelled' | 'on-hold' | 'error';
export type StepStatus = 'pending' | 'active' | 'completed' | 'rejected' | 'skipped' | 'escalated' | 'timed-out' | 'cancelled';

export interface WorkflowStep {
  stepId: string;
  name: string;
  description?: string;
  type: StepType;
  order: number;
  approverType?: string;
  approverIds?: string[];
  approverRoles?: string[];
  approvalMode?: 'any' | 'all' | 'majority';
  taskConfig?: {
    title: string;
    description?: string;
    assigneeType: string;
    assigneeIds?: string[];
    assigneeRoles?: string[];
    dueInDays?: number;
    priority?: string;
  };
  conditions?: Array<{ field: string; operator: string; value: any }>;
  trueBranch?: string;
  falseBranch?: string;
  actions?: Array<{ type: string; config: Record<string, any> }>;
  notificationConfig?: {
    recipients: string;
    template: string;
    channels: string[];
  };
  escalation?: {
    enabled: boolean;
    afterHours: number;
    escalateTo: string;
    maxEscalations: number;
  };
  sla?: {
    expectedHours: number;
    warningHours: number;
  };
  nextSteps?: string[];
  isTerminal?: boolean;
}

export interface WorkflowTemplate {
  _id: string;
  name: string;
  description?: string;
  category: 'procurement' | 'finance' | 'project' | 'hr' | 'operations' | 'custom';
  entityType: EntityType;
  version: number;
  isActive: boolean;
  isDefault: boolean;
  trigger: {
    type: string;
    entityType?: string;
    conditions?: any[];
    statusFrom?: string;
    statusTo?: string;
    amountThreshold?: number;
  };
  steps: WorkflowStep[];
  departments?: Array<{ _id: string; name: string }>;
  createdBy: { _id: string; name: string; email: string };
  tags?: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedDurationHours?: number;
  createdAt: string;
  updatedAt: string;
}

export interface StepApproval {
  userId: { _id: string; name: string; email: string };
  action: 'approved' | 'rejected' | 'delegated';
  comments?: string;
  timestamp: string;
}

export interface StepExecution {
  stepId: string;
  stepName: string;
  stepType: string;
  status: StepStatus;
  startedAt?: string;
  completedAt?: string;
  dueAt?: string;
  approvals?: StepApproval[];
  requiredApprovals?: number;
  receivedApprovals?: number;
  assignedTo?: Array<{ _id: string; name: string; email: string }>;
  escalationLevel?: number;
  result?: string;
  resultData?: Record<string, any>;
  comments?: string;
  slaBreached?: boolean;
}

export interface WorkflowComment {
  userId: { _id: string; name: string; email: string; avatar?: string };
  stepId?: string;
  comment: string;
  attachments?: string[];
  timestamp: string;
}

export interface WorkflowAuditEntry {
  action: string;
  performedBy: { _id: string; name: string; email: string };
  stepId?: string;
  details?: Record<string, any>;
  timestamp: string;
}

export interface WorkflowInstance {
  _id: string;
  templateId: string | WorkflowTemplate;
  templateName: string;
  templateVersion: number;
  entityType: EntityType;
  entityId: string;
  entityTitle: string;
  projectId?: { _id: string; name: string; status?: string };
  departmentId?: { _id: string; name: string };
  status: InstanceStatus;
  currentStepId: string;
  currentStepName: string;
  progress: number;
  steps: StepExecution[];
  initiatedBy: { _id: string; name: string; email: string; avatar?: string };
  currentAssignees: Array<{ _id: string; name: string; email: string; avatar?: string }>;
  participants: Array<{ _id: string; name: string; email: string; avatar?: string }>;
  priority: 'low' | 'medium' | 'high' | 'critical';
  dueDate?: string;
  slaBreached: boolean;
  metadata?: Record<string, any>;
  comments: WorkflowComment[];
  auditTrail: WorkflowAuditEntry[];
  tags?: string[];
  startedAt: string;
  completedAt?: string;
  cancelledAt?: string;
  cancelledBy?: { _id: string; name: string };
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowDashboardStats {
  statusDistribution: Record<string, number>;
  priorityDistribution: Record<string, number>;
  avgCompletionTimeHours: number;
  sla: {
    total: number;
    breached: number;
    complianceRate: number;
  };
  recentActivity: WorkflowInstance[];
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// ==========================================
// API METHODS
// ==========================================

export const workflowsAPI = {
  // --- Templates ---
  getTemplates: async (params: Record<string, any> = {}) => {
    const response = await api.get('/workflows/templates', { params });
    return response.data;
  },

  getTemplateById: async (id: string) => {
    const response = await api.get(`/workflows/templates/${id}`);
    return response.data;
  },

  createTemplate: async (data: Partial<WorkflowTemplate>) => {
    const response = await api.post('/workflows/templates', data);
    return response.data;
  },

  updateTemplate: async (id: string, data: Partial<WorkflowTemplate>) => {
    const response = await api.put(`/workflows/templates/${id}`, data);
    return response.data;
  },

  deleteTemplate: async (id: string) => {
    const response = await api.delete(`/workflows/templates/${id}`);
    return response.data;
  },

  cloneTemplate: async (id: string) => {
    const response = await api.post(`/workflows/templates/${id}/clone`);
    return response.data;
  },

  // --- Instances ---
  getInstances: async (params: Record<string, any> = {}) => {
    const response = await api.get('/workflows/instances', { params });
    return response.data;
  },

  getInstanceById: async (id: string) => {
    const response = await api.get(`/workflows/instances/${id}`);
    return response.data;
  },

  startWorkflow: async (data: {
    templateId: string;
    entityType: EntityType;
    entityId: string;
    entityTitle: string;
    projectId?: string;
    departmentId?: string;
    metadata?: Record<string, any>;
    priority?: string;
  }) => {
    const response = await api.post('/workflows/instances', data);
    return response.data;
  },

  getMyPendingActions: async () => {
    const response = await api.get('/workflows/instances/my-pending');
    return response.data;
  },

  getEntityWorkflows: async (entityType: string, entityId: string) => {
    const response = await api.get(`/workflows/entity/${entityType}/${entityId}`);
    return response.data;
  },

  processStepAction: async (instanceId: string, stepId: string, data: {
    action: 'approve' | 'reject' | 'complete' | 'delegate' | 'skip';
    comments?: string;
    delegateTo?: string;
    resultData?: Record<string, any>;
  }) => {
    const response = await api.post(`/workflows/instances/${instanceId}/steps/${stepId}/action`, data);
    return response.data;
  },

  addComment: async (instanceId: string, data: { comment: string; stepId?: string; attachments?: string[] }) => {
    const response = await api.post(`/workflows/instances/${instanceId}/comments`, data);
    return response.data;
  },

  cancelWorkflow: async (instanceId: string, reason: string) => {
    const response = await api.post(`/workflows/instances/${instanceId}/cancel`, { reason });
    return response.data;
  },

  holdWorkflow: async (instanceId: string, reason?: string) => {
    const response = await api.post(`/workflows/instances/${instanceId}/hold`, { reason });
    return response.data;
  },

  resumeWorkflow: async (instanceId: string) => {
    const response = await api.post(`/workflows/instances/${instanceId}/resume`);
    return response.data;
  },

  // --- Analytics ---
  getDashboardStats: async (params: Record<string, any> = {}) => {
    const response = await api.get('/workflows/analytics/dashboard', { params });
    return response.data;
  },

  getPerformanceReport: async (params: Record<string, any> = {}) => {
    const response = await api.get('/workflows/analytics/performance', { params });
    return response.data;
  },

  getBottleneckAnalysis: async (params: Record<string, any> = {}) => {
    const response = await api.get('/workflows/analytics/bottlenecks', { params });
    return response.data;
  },

  // --- Project-Workflow Integration ---
  getProjectWorkflow: async (projectId: string) => {
    const response = await api.get(`/workflows/project/${projectId}`);
    return response.data;
  },

  getProjectWorkflowHistory: async (projectId: string) => {
    const response = await api.get(`/workflows/project/${projectId}/history`);
    return response.data;
  },

  startProjectWorkflow: async (projectId: string, data?: { workflowTemplateId?: string; metadata?: Record<string, any> }) => {
    const response = await api.post(`/workflows/project/${projectId}/start`, data || {});
    return response.data;
  },

  restartProjectWorkflow: async (projectId: string, workflowTemplateId?: string) => {
    const response = await api.post(`/workflows/project/${projectId}/restart`, { workflowTemplateId });
    return response.data;
  },

  startWorkflowWithProject: async (data: {
    templateId: string;
    entityType: 'project';
    projectName: string;
    projectDescription?: string;
    startDate?: string;
    endDate?: string;
    budget?: number;
    currency?: string;
    priority?: string;
    managers?: string[];
    team?: string[];
    departments?: string[];
    client?: string;
    tags?: string[];
    metadata?: Record<string, any>;
  }) => {
    const response = await api.post('/workflows/instances', data);
    return response.data;
  },
};

export default workflowsAPI;
