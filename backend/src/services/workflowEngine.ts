import mongoose from 'mongoose';
import WorkflowTemplate, { IWorkflowStep, IWorkflowTemplate, ICondition } from '../models/WorkflowTemplate';
import WorkflowInstance, { IWorkflowInstance, IStepExecution, StepStatus } from '../models/WorkflowInstance';
import User from '../models/User';
import { Role } from '../models/Role';
import Employee from '../models/Employee';
import Department from '../models/Department';
import { logger } from '../utils/logger';

// Lazy import to avoid circular dependency
let _integrationService: any = null;
const getIntegrationService = async () => {
  if (!_integrationService) {
    const { WorkflowProjectIntegration } = await import('./workflowProjectIntegration');
    _integrationService = WorkflowProjectIntegration;
  }
  return _integrationService;
};

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Steps that execute without human interaction the moment they activate
const AUTO_STEP_TYPES = new Set(['condition', 'notification', 'auto-action']);

// Safety bound on auto-step chains so a mis-wired template (cycle) cannot loop forever
const MAX_AUTO_ADVANCE_DEPTH = 50;

/**
 * WorkflowEngine - Core state machine for workflow execution.
 * Handles step transitions, condition evaluation, approvals, escalations, and SLA tracking.
 */
export class WorkflowEngine {

  /**
   * Start a new workflow instance from a template
   */
  static async startWorkflow(params: {
    templateId: string;
    entityType: string;
    entityId: string;
    entityTitle: string;
    initiatedBy: string;
    projectId?: string;
    departmentId?: string;
    metadata?: Record<string, any>;
    priority?: 'low' | 'medium' | 'high' | 'critical';
  }): Promise<IWorkflowInstance> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const template = await WorkflowTemplate.findById(params.templateId).session(session);
      if (!template) throw new Error('Workflow template not found');
      if (!template.isActive) throw new Error('Workflow template is not active');
      if (!template.steps?.length) throw new Error('Workflow template has no steps');

      // Build step executions from template; all pending until activated so
      // SLA clocks start at activation, not at workflow start
      const steps: IStepExecution[] = template.steps.map(step => ({
        stepId: step.stepId,
        stepName: step.name,
        stepType: step.type,
        status: 'pending' as StepStatus,
        requiredApprovals: this.getRequiredApprovals(step),
        receivedApprovals: 0
      }));

      const firstStep = template.steps[0];

      const instance = new WorkflowInstance({
        templateId: template._id,
        templateName: template.name,
        templateVersion: template.version,
        entityType: params.entityType,
        entityId: params.entityId,
        entityTitle: params.entityTitle,
        projectId: params.projectId,
        departmentId: params.departmentId,
        status: 'active',
        currentStepId: firstStep.stepId,
        currentStepName: firstStep.name,
        progress: 0,
        steps,
        initiatedBy: params.initiatedBy,
        currentAssignees: [],
        participants: [params.initiatedBy],
        priority: params.priority || template.priority,
        dueDate: template.estimatedDurationHours
          ? new Date(Date.now() + template.estimatedDurationHours * 3600000)
          : undefined,
        slaBreached: false,
        metadata: params.metadata,
        auditTrail: [{
          action: 'workflow_started',
          performedBy: params.initiatedBy,
          details: { templateName: template.name, entityTitle: params.entityTitle },
          timestamp: new Date()
        }]
      });

      await this.activateStep(instance, firstStep.stepId, session);
      this.mergeParticipants(instance);

      await instance.save({ session });
      await session.commitTransaction();

      logger.info(`Workflow started: ${template.name} for ${params.entityType}/${params.entityId}`);
      return instance;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Process an action on a workflow step (approve, reject, complete task, etc.)
   */
  static async processStepAction(params: {
    instanceId: string;
    stepId: string;
    action: 'approve' | 'reject' | 'complete' | 'delegate' | 'skip';
    userId: string;
    isPrivileged?: boolean;
    comments?: string;
    delegateTo?: string;
    resultData?: Record<string, any>;
  }): Promise<IWorkflowInstance> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const instance = await WorkflowInstance.findById(params.instanceId).session(session);
      if (!instance) throw new Error('Workflow instance not found');
      if (instance.status !== 'active') throw new Error(`Workflow is ${instance.status}, cannot process action`);

      const stepIndex = instance.steps.findIndex(s => s.stepId === params.stepId);
      if (stepIndex === -1) throw new Error('Step not found in workflow');

      const step = instance.steps[stepIndex];
      if (step.status !== 'active' && step.status !== 'escalated') {
        throw new Error(`Step is ${step.status}, cannot process action`);
      }

      // Authorization: only assigned users may act; skip is admin-only because
      // it bypasses the step entirely
      const isAssigned = step.assignedTo?.some(a => a.toString() === params.userId);
      if (!params.isPrivileged) {
        if (params.action === 'skip') {
          throw new Error('Only administrators can skip workflow steps');
        }
        if (!isAssigned) {
          throw new Error('You are not assigned to act on this step');
        }
      }

      // Get template step for configuration
      const template = await WorkflowTemplate.findById(instance.templateId).session(session);
      if (!template) throw new Error('Workflow template not found');
      const templateStep = template.steps.find(s => s.stepId === params.stepId);
      if (!templateStep) throw new Error('Step configuration not found in template');

      if ((params.action === 'approve' || params.action === 'reject') && templateStep.type !== 'approval') {
        throw new Error(`Cannot ${params.action} a ${templateStep.type} step`);
      }
      if (params.action === 'complete' && templateStep.type !== 'task') {
        throw new Error(`Cannot complete a ${templateStep.type} step`);
      }

      switch (params.action) {
        case 'approve':
          await this.handleApproval(instance, step, stepIndex, templateStep, params, session);
          break;
        case 'reject':
          await this.handleRejection(instance, step, stepIndex, params, session);
          break;
        case 'complete':
          await this.handleCompletion(instance, step, stepIndex, templateStep, params, session);
          break;
        case 'delegate':
          await this.handleDelegation(instance, step, stepIndex, params, session);
          break;
        case 'skip':
          await this.handleSkip(instance, step, stepIndex, params, session);
          break;
      }

      // Add audit entry
      instance.auditTrail.push({
        action: `step_${params.action}`,
        performedBy: new mongoose.Types.ObjectId(params.userId),
        stepId: params.stepId,
        details: { comments: params.comments, resultData: params.resultData },
        timestamp: new Date()
      });

      // Add participant
      if (!instance.participants.some(p => p.toString() === params.userId)) {
        instance.participants.push(new mongoose.Types.ObjectId(params.userId));
      }

      await instance.save({ session });
      await session.commitTransaction();

      logger.info(`Workflow step action: ${params.action} on ${params.stepId} by ${params.userId}`);
      return instance;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Handle approval action
   */
  private static async handleApproval(
    instance: IWorkflowInstance,
    step: IStepExecution,
    stepIndex: number,
    templateStep: IWorkflowStep,
    params: any,
    session: any
  ) {
    // One vote per user: without this, a single approver could satisfy an
    // 'all'/'majority' quorum by approving repeatedly
    if (step.approvals?.some(a => a.action === 'approved' && a.userId.toString() === params.userId)) {
      throw new Error('You have already approved this step');
    }

    if (!step.approvals) step.approvals = [];
    step.approvals.push({
      userId: new mongoose.Types.ObjectId(params.userId),
      action: 'approved',
      comments: params.comments,
      timestamp: new Date()
    });
    step.receivedApprovals = step.approvals.filter(a => a.action === 'approved').length;

    // Check if enough approvals received
    const requiredApprovals = this.getRequiredApprovals(templateStep, step.assignedTo?.length);
    if (step.receivedApprovals >= requiredApprovals) {
      step.status = 'completed';
      step.result = 'approved';
      step.completedAt = new Date();

      // Advance to next step
      await this.advanceWorkflow(instance, templateStep, session);
    }
  }

  /**
   * Handle rejection action
   */
  private static async handleRejection(
    instance: IWorkflowInstance,
    step: IStepExecution,
    stepIndex: number,
    params: any,
    session: any
  ) {
    step.status = 'rejected';
    step.result = 'rejected';
    step.completedAt = new Date();
    step.comments = params.comments;

    if (!step.approvals) step.approvals = [];
    step.approvals.push({
      userId: new mongoose.Types.ObjectId(params.userId),
      action: 'rejected',
      comments: params.comments,
      timestamp: new Date()
    });

    // Reject the entire workflow
    instance.status = 'rejected';
    instance.completedAt = new Date();
    instance.progress = this.calculateProgress(instance);
    instance.currentAssignees = [];

    // Cancel remaining steps
    instance.steps.forEach(s => {
      if (s.status === 'pending') s.status = 'cancelled';
    });

    // Trigger rejection callback (async, non-blocking)
    setImmediate(async () => {
      try {
        const integration = await getIntegrationService();
        await integration.onWorkflowRejected(instance._id.toString());
      } catch (err) {
        logger.error('Error in workflow rejection callback:', err);
      }
    });
  }

  /**
   * Handle task completion
   */
  private static async handleCompletion(
    instance: IWorkflowInstance,
    step: IStepExecution,
    stepIndex: number,
    templateStep: IWorkflowStep,
    params: any,
    session: any
  ) {
    step.status = 'completed';
    step.result = 'completed';
    step.completedAt = new Date();
    step.resultData = params.resultData;
    step.comments = params.comments;

    // Advance to next step
    await this.advanceWorkflow(instance, templateStep, session);
  }

  /**
   * Handle delegation
   */
  private static async handleDelegation(
    instance: IWorkflowInstance,
    step: IStepExecution,
    stepIndex: number,
    params: any,
    session: any
  ) {
    if (!params.delegateTo) throw new Error('delegateTo is required for delegation');
    if (!mongoose.isValidObjectId(params.delegateTo)) throw new Error('delegateTo must be a valid user id');

    if (!step.approvals) step.approvals = [];
    step.approvals.push({
      userId: new mongoose.Types.ObjectId(params.userId),
      action: 'delegated',
      delegatedTo: new mongoose.Types.ObjectId(params.delegateTo),
      comments: params.comments,
      timestamp: new Date()
    });

    // Update assignees
    const delegateId = new mongoose.Types.ObjectId(params.delegateTo);
    if (!step.assignedTo) step.assignedTo = [];
    if (!step.assignedTo.some(a => a.toString() === params.delegateTo)) {
      step.assignedTo.push(delegateId);
    }

    // Update instance current assignees
    if (!instance.currentAssignees.some(a => a.toString() === params.delegateTo)) {
      instance.currentAssignees.push(delegateId);
    }
  }

  /**
   * Handle skip action
   */
  private static async handleSkip(
    instance: IWorkflowInstance,
    step: IStepExecution,
    stepIndex: number,
    params: any,
    session: any
  ) {
    step.status = 'skipped';
    step.completedAt = new Date();
    step.comments = params.comments || 'Step skipped';

    // Get template to advance
    const template = await WorkflowTemplate.findById(instance.templateId).session(session);
    if (template) {
      const templateStep = template.steps.find(s => s.stepId === params.stepId);
      if (templateStep) {
        await this.advanceWorkflow(instance, templateStep, session);
      }
    }
  }

  /**
   * Advance workflow to the next step(s)
   */
  private static async advanceWorkflow(
    instance: IWorkflowInstance,
    currentTemplateStep: IWorkflowStep,
    session: any,
    depth = 0
  ) {
    // Calculate progress
    instance.progress = this.calculateProgress(instance);

    // Condition steps route via branches, not nextSteps
    const hasNext = currentTemplateStep.type === 'condition'
      ? !!(currentTemplateStep.trueBranch || currentTemplateStep.falseBranch || currentTemplateStep.nextSteps?.length)
      : !!currentTemplateStep.nextSteps?.length;

    // Check if this is a terminal step
    if (currentTemplateStep.isTerminal || !hasNext) {
      this.completeWorkflow(instance);
      return;
    }

    // Handle condition steps
    if (currentTemplateStep.type === 'condition') {
      const nextStepId = await this.evaluateCondition(instance, currentTemplateStep);
      if (nextStepId) {
        await this.activateStep(instance, nextStepId, session, depth + 1);
      } else {
        this.completeWorkflow(instance);
        return;
      }
    } else {
      // Activate next step(s)
      for (const nextStepId of currentTemplateStep.nextSteps!) {
        await this.activateStep(instance, nextStepId, session, depth + 1);
      }
    }

    this.refreshCurrentStepPointers(instance);
    this.mergeParticipants(instance);
  }

  /**
   * Mark the workflow completed and notify the integration layer
   */
  private static completeWorkflow(instance: IWorkflowInstance) {
    instance.status = 'completed';
    instance.completedAt = new Date();
    instance.progress = 100;
    instance.currentAssignees = [];

    // Trigger completion callback (async, non-blocking)
    setImmediate(async () => {
      try {
        const integration = await getIntegrationService();
        await integration.onWorkflowCompleted(instance._id.toString());
      } catch (err) {
        logger.error('Error in workflow completion callback:', err);
      }
    });
  }

  /**
   * Activate a specific step. Auto-executing step types (condition,
   * notification, auto-action) are processed immediately; timer steps get a
   * due date and are advanced by the cron; human steps get resolved assignees.
   */
  private static async activateStep(
    instance: IWorkflowInstance,
    stepId: string,
    session: any,
    depth = 0
  ) {
    if (depth > MAX_AUTO_ADVANCE_DEPTH) {
      logger.error(`Workflow ${instance._id}: auto-advance depth exceeded at step ${stepId}; template likely has a cycle`);
      instance.status = 'error';
      return;
    }

    const step = instance.steps.find(s => s.stepId === stepId);
    if (!step || step.status !== 'pending') return;

    step.status = 'active';
    step.startedAt = new Date();

    // Update instance current step
    instance.currentStepId = stepId;
    instance.currentStepName = step.stepName;

    const template = await WorkflowTemplate.findById(instance.templateId).session(session);
    const templateStep = template?.steps.find(s => s.stepId === stepId);
    if (!templateStep) return;

    // Set due date based on SLA (clock starts at activation)
    if (templateStep.sla) {
      step.dueAt = new Date(Date.now() + templateStep.sla.expectedHours * 3600000);
      step.slaWarningAt = new Date(Date.now() + templateStep.sla.warningHours * 3600000);
    }

    // Timer steps wait until dueAt; the workflow cron advances them
    if (templateStep.type === 'timer') {
      const hours = templateStep.timerConfig?.durationHours || templateStep.sla?.expectedHours || 24;
      step.dueAt = new Date(Date.now() + hours * 3600000);
      return;
    }

    // Auto-executing steps complete themselves and advance
    if (AUTO_STEP_TYPES.has(templateStep.type)) {
      await this.autoProcessStep(instance, step, templateStep, session, depth);
      return;
    }

    // Human steps: resolve assignees
    const assignees = await this.resolveStepAssignees(templateStep, instance.metadata, session);
    step.assignedTo = assignees;
    instance.currentAssignees = assignees;
    if (templateStep.type === 'approval') {
      step.requiredApprovals = this.getRequiredApprovals(templateStep, assignees.length);
    }
    if ((templateStep.type === 'approval' || templateStep.type === 'task') && assignees.length === 0) {
      logger.warn(`Workflow ${instance._id}: step "${templateStep.name}" activated with no resolvable assignees; only administrators will be able to act on it`);
    }

    // Create task if this is a task-type step
    if (templateStep.type === 'task' && templateStep.taskConfig) {
      setImmediate(async () => {
        try {
          const integration = await getIntegrationService();
          await integration.createTaskForActiveStep(instance, instance.initiatedBy?.toString());
        } catch (err) {
          logger.error('Error creating task for workflow step:', err);
        }
      });
    }
  }

  /**
   * Execute an auto step (condition / notification / auto-action) and advance
   */
  private static async autoProcessStep(
    instance: IWorkflowInstance,
    step: IStepExecution,
    templateStep: IWorkflowStep,
    session: any,
    depth: number
  ) {
    if (templateStep.type === 'auto-action') {
      await this.executeAutoActions(instance, templateStep);
    }
    if (templateStep.type === 'notification') {
      // No dedicated notification infrastructure yet; record execution so the
      // step never blocks the workflow
      logger.info(`Workflow ${instance._id}: notification step "${templateStep.name}" executed (recipients: ${templateStep.notificationConfig?.recipients || 'unspecified'})`);
    }

    step.status = 'completed';
    step.result = 'completed';
    step.completedAt = new Date();

    instance.auditTrail.push({
      action: `step_auto_${templateStep.type === 'condition' ? 'evaluated' : 'executed'}`,
      stepId: step.stepId,
      details: { stepType: templateStep.type },
      timestamp: new Date()
    });

    await this.advanceWorkflow(instance, templateStep, session, depth);
  }

  /**
   * Execute configured actions of an auto-action step
   */
  private static async executeAutoActions(instance: IWorkflowInstance, templateStep: IWorkflowStep) {
    for (const action of templateStep.actions || []) {
      try {
        if (action.type === 'change-status' && instance.entityType === 'project' && action.config?.newStatus) {
          const Project = mongoose.model('Project');
          await Project.findByIdAndUpdate(instance.entityId, { $set: { status: action.config.newStatus } });
          logger.info(`Workflow ${instance._id}: auto-action set project ${instance.entityId} status to "${action.config.newStatus}"`);
        } else {
          logger.warn(`Workflow ${instance._id}: auto-action type "${action.type}" is not supported for entity "${instance.entityType}"; skipping`);
        }
      } catch (err) {
        logger.error(`Workflow ${instance._id}: auto-action "${action.type}" failed:`, err);
      }
    }
  }

  /**
   * Evaluate condition step and return the next step ID
   */
  private static async evaluateCondition(
    instance: IWorkflowInstance,
    step: IWorkflowStep
  ): Promise<string | null> {
    if (!step.conditions?.length) return step.trueBranch || step.nextSteps?.[0] || null;

    const entityData = instance.metadata || {};
    const allConditionsMet = step.conditions.every(condition =>
      this.evaluateSingleCondition(condition, entityData)
    );

    return allConditionsMet ? (step.trueBranch || null) : (step.falseBranch || null);
  }

  /**
   * Evaluate a single condition
   */
  private static evaluateSingleCondition(condition: ICondition, data: Record<string, any>): boolean {
    const fieldValue = this.getNestedValue(data, condition.field);

    switch (condition.operator) {
      case 'equals': return fieldValue === condition.value;
      case 'not-equals': return fieldValue !== condition.value;
      case 'greater-than': return Number(fieldValue) > Number(condition.value);
      case 'less-than': return Number(fieldValue) < Number(condition.value);
      case 'contains': return String(fieldValue).includes(String(condition.value));
      case 'in': return Array.isArray(condition.value) && condition.value.includes(fieldValue);
      case 'not-in': return Array.isArray(condition.value) && !condition.value.includes(fieldValue);
      default: return false;
    }
  }

  /**
   * Get nested value from object using dot notation
   */
  private static getNestedValue(obj: Record<string, any>, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Resolve assignees for a step. Sources, in order:
   * - explicit user ids (approverIds / taskConfig.assigneeIds)
   * - role names matched against Role documents, then users holding them
   * - role names matched against department names (department members)
   * - approverType 'project-manager' -> metadata.projectManagers
   * - approverType 'department-head' -> Department.manager.email -> User
   */
  private static async resolveStepAssignees(
    step: IWorkflowStep,
    metadata: Record<string, any> | undefined,
    session: any
  ): Promise<mongoose.Types.ObjectId[]> {
    const resolved = new Map<string, mongoose.Types.ObjectId>();
    const add = (id: any) => {
      if (!id) return;
      const str = id.toString();
      if (mongoose.isValidObjectId(str)) resolved.set(str, new mongoose.Types.ObjectId(str));
    };

    const explicitIds = step.type === 'task' ? step.taskConfig?.assigneeIds : step.approverIds;
    explicitIds?.forEach(add);

    const roleNames = ((step.type === 'task' ? step.taskConfig?.assigneeRoles : step.approverRoles) || [])
      .map(r => r.trim())
      .filter(Boolean);

    if (roleNames.length) {
      const namePatterns = roleNames.map(r => new RegExp(`^${escapeRegex(r)}$`, 'i'));

      // Users holding a matching Role
      const roles = await Role.find({ name: { $in: namePatterns }, isActive: true })
        .select('_id')
        .session(session);
      if (roles.length) {
        const users = await User.find({
          role: { $in: roles.map(r => r._id) },
          status: { $nin: ['disabled', 'inactive'] }
        })
          .select('_id')
          .limit(100)
          .session(session);
        users.forEach(u => add(u._id));
      }

      // Users whose employee record belongs to a department with a matching name
      const employees = await Employee.find({
        $or: [
          { departments: { $in: namePatterns } },
          { department: { $in: namePatterns } }
        ]
      })
        .select('user')
        .limit(100)
        .session(session);
      employees.forEach(e => add(e.user));
    }

    const assigneeType = step.type === 'task' ? step.taskConfig?.assigneeType : step.approverType;

    if (assigneeType === 'project-manager' && Array.isArray(metadata?.projectManagers)) {
      metadata!.projectManagers.forEach(add);
    }

    if (assigneeType === 'department-head') {
      const deptIds = (Array.isArray(metadata?.projectDepartments) ? metadata!.projectDepartments : [])
        .filter((id: any) => mongoose.isValidObjectId(id?.toString?.() || ''));
      if (deptIds.length) {
        const departments = await Department.find({ _id: { $in: deptIds } })
          .select('manager.email')
          .session(session);
        const emails = departments.map(d => (d as any).manager?.email).filter(Boolean);
        if (emails.length) {
          const heads = await User.find({ email: { $in: emails } }).select('_id').session(session);
          heads.forEach(h => add(h._id));
        }
      }
    }

    return Array.from(resolved.values());
  }

  /**
   * Point currentStepId/currentAssignees at the union of all active steps,
   * so parallel branches keep every branch's assignees actionable
   */
  private static refreshCurrentStepPointers(instance: IWorkflowInstance) {
    const activeSteps = instance.steps.filter(s => s.status === 'active' || s.status === 'escalated');
    if (!activeSteps.length) return;

    instance.currentStepId = activeSteps[0].stepId;
    instance.currentStepName = activeSteps[0].stepName;

    const union = new Map<string, mongoose.Types.ObjectId>();
    activeSteps.forEach(s => s.assignedTo?.forEach(a => union.set(a.toString(), a)));
    instance.currentAssignees = Array.from(union.values());
  }

  /**
   * Ensure everyone currently assigned is a participant
   */
  private static mergeParticipants(instance: IWorkflowInstance) {
    const existing = new Set(instance.participants.map(p => p.toString()));
    instance.currentAssignees.forEach(a => {
      if (!existing.has(a.toString())) {
        instance.participants.push(a);
        existing.add(a.toString());
      }
    });
  }

  /**
   * Get required number of approvals for a step. The pool is the larger of
   * the explicit approver list and the resolved assignees (role-based
   * approvers have no approverIds).
   */
  private static getRequiredApprovals(step: IWorkflowStep, resolvedCount?: number): number {
    const poolSize = Math.max(step.approverIds?.length || 0, resolvedCount || 0) || 1;
    if (step.approvalMode === 'all') {
      return poolSize;
    }
    if (step.approvalMode === 'majority') {
      return Math.ceil(poolSize / 2);
    }
    return 1; // 'any' mode
  }

  /**
   * Calculate workflow progress percentage
   */
  private static calculateProgress(instance: IWorkflowInstance): number {
    const totalSteps = instance.steps.length;
    if (totalSteps === 0) return 0;

    const completedSteps = instance.steps.filter(
      s => s.status === 'completed' || s.status === 'skipped'
    ).length;

    return Math.round((completedSteps / totalSteps) * 100);
  }

  /**
   * Escalate a step that has breached SLA
   */
  static async escalateStep(instanceId: string, stepId: string): Promise<IWorkflowInstance | null> {
    const instance = await WorkflowInstance.findById(instanceId);
    if (!instance || instance.status !== 'active') return null;

    const step = instance.steps.find(s => s.stepId === stepId);
    if (!step || step.status !== 'active') return null;

    step.status = 'escalated';
    step.escalationLevel = (step.escalationLevel || 0) + 1;
    step.escalatedAt = new Date();
    step.slaBreached = true;
    instance.slaBreached = true;

    instance.auditTrail.push({
      action: 'step_escalated',
      stepId,
      details: { escalationLevel: step.escalationLevel, system: true },
      timestamp: new Date()
    });

    await instance.save();
    logger.warn(`Workflow step escalated: ${stepId} in instance ${instanceId}`);
    return instance;
  }

  /**
   * Cancel a workflow instance
   */
  static async cancelWorkflow(
    instanceId: string,
    userId: string,
    reason: string
  ): Promise<IWorkflowInstance> {
    const instance = await WorkflowInstance.findById(instanceId);
    if (!instance) throw new Error('Workflow instance not found');
    if (instance.status === 'completed' || instance.status === 'cancelled') {
      throw new Error(`Cannot cancel workflow in ${instance.status} status`);
    }

    instance.status = 'cancelled';
    instance.cancelledAt = new Date();
    instance.cancelledBy = new mongoose.Types.ObjectId(userId);
    instance.cancellationReason = reason;
    instance.currentAssignees = [];

    // Cancel all pending/active steps
    instance.steps.forEach(step => {
      if (step.status === 'pending' || step.status === 'active' || step.status === 'escalated') {
        step.status = 'cancelled';
      }
    });

    instance.auditTrail.push({
      action: 'workflow_cancelled',
      performedBy: new mongoose.Types.ObjectId(userId),
      details: { reason },
      timestamp: new Date()
    });

    await instance.save();
    logger.info(`Workflow cancelled: ${instanceId} by ${userId}`);

    // Trigger cancellation callback (async, non-blocking)
    setImmediate(async () => {
      try {
        const integration = await getIntegrationService();
        await integration.onWorkflowCancelled(instanceId);
      } catch (err) {
        logger.error('Error in workflow cancellation callback:', err);
      }
    });

    return instance;
  }

  /**
   * Put a workflow on hold
   */
  static async holdWorkflow(instanceId: string, userId: string, reason?: string): Promise<IWorkflowInstance> {
    const instance = await WorkflowInstance.findById(instanceId);
    if (!instance) throw new Error('Workflow instance not found');
    if (instance.status !== 'active') throw new Error('Only active workflows can be put on hold');

    instance.status = 'on-hold';
    instance.auditTrail.push({
      action: 'workflow_on_hold',
      performedBy: new mongoose.Types.ObjectId(userId),
      details: { reason },
      timestamp: new Date()
    });

    await instance.save();
    return instance;
  }

  /**
   * Resume a workflow from hold
   */
  static async resumeWorkflow(instanceId: string, userId: string): Promise<IWorkflowInstance> {
    const instance = await WorkflowInstance.findById(instanceId);
    if (!instance) throw new Error('Workflow instance not found');
    if (instance.status !== 'on-hold') throw new Error('Only on-hold workflows can be resumed');

    instance.status = 'active';
    instance.auditTrail.push({
      action: 'workflow_resumed',
      performedBy: new mongoose.Types.ObjectId(userId),
      timestamp: new Date()
    });

    await instance.save();
    return instance;
  }

  /**
   * Find workflows that need escalation (SLA breached)
   */
  static async findBreachedWorkflows(): Promise<IWorkflowInstance[]> {
    const now = new Date();
    return WorkflowInstance.find({
      status: 'active',
      steps: {
        $elemMatch: {
          status: 'active',
          stepType: { $ne: 'timer' },
          dueAt: { $lt: now },
          slaBreached: { $ne: true }
        }
      }
    });
  }

  /**
   * Advance timer steps whose wait period has elapsed. Called from the
   * workflow cron; idempotent (completed steps are never re-processed).
   */
  static async processDueTimerSteps(): Promise<number> {
    const now = new Date();
    const instances = await WorkflowInstance.find({
      status: 'active',
      steps: { $elemMatch: { status: 'active', stepType: 'timer', dueAt: { $lte: now } } }
    });

    let advanced = 0;
    for (const instance of instances) {
      try {
        const template = await WorkflowTemplate.findById(instance.templateId);
        if (!template) continue;

        for (const step of instance.steps) {
          if (step.stepType !== 'timer' || step.status !== 'active' || !step.dueAt || step.dueAt > now) continue;

          step.status = 'completed';
          step.result = 'completed';
          step.completedAt = new Date();
          instance.auditTrail.push({
            action: 'step_timer_elapsed',
            stepId: step.stepId,
            details: { system: true },
            timestamp: new Date()
          });

          const templateStep = template.steps.find(s => s.stepId === step.stepId);
          if (templateStep) {
            await this.advanceWorkflow(instance, templateStep, null);
          }
          advanced++;
        }

        await instance.save();
      } catch (err) {
        logger.error(`Error advancing timer steps for workflow ${instance._id}:`, err);
      }
    }
    return advanced;
  }
}

export default WorkflowEngine;
