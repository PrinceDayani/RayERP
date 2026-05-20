import mongoose from 'mongoose';
import WorkflowTemplate, { IWorkflowStep, IWorkflowTemplate, ICondition } from '../models/WorkflowTemplate';
import WorkflowInstance, { IWorkflowInstance, IStepExecution, StepStatus } from '../models/WorkflowInstance';
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

      // Build step executions from template
      const steps: IStepExecution[] = template.steps.map((step, index) => ({
        stepId: step.stepId,
        stepName: step.name,
        stepType: step.type,
        status: index === 0 ? 'active' : 'pending',
        startedAt: index === 0 ? new Date() : undefined,
        dueAt: step.sla ? new Date(Date.now() + step.sla.expectedHours * 3600000) : undefined,
        slaWarningAt: step.sla ? new Date(Date.now() + step.sla.warningHours * 3600000) : undefined,
        requiredApprovals: step.approvalMode === 'all' ? (step.approverIds?.length || 1) : 1,
        receivedApprovals: 0
      }));

      const firstStep = template.steps[0];
      const currentAssignees = this.resolveAssignees(firstStep, params.metadata);

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
        currentAssignees,
        participants: [params.initiatedBy, ...currentAssignees].filter(Boolean),
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

      // Get template step for configuration
      const template = await WorkflowTemplate.findById(instance.templateId).session(session);
      if (!template) throw new Error('Workflow template not found');
      const templateStep = template.steps.find(s => s.stepId === params.stepId);

      switch (params.action) {
        case 'approve':
          await this.handleApproval(instance, step, stepIndex, templateStep!, params, session);
          break;
        case 'reject':
          await this.handleRejection(instance, step, stepIndex, params, session);
          break;
        case 'complete':
          await this.handleCompletion(instance, step, stepIndex, templateStep!, params, session);
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
    // Record approval
    if (!step.approvals) step.approvals = [];
    step.approvals.push({
      userId: new mongoose.Types.ObjectId(params.userId),
      action: 'approved',
      comments: params.comments,
      timestamp: new Date()
    });
    step.receivedApprovals = (step.receivedApprovals || 0) + 1;

    // Check if enough approvals received
    const requiredApprovals = this.getRequiredApprovals(templateStep);
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
    step.assignedTo.push(delegateId);
    
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
    session: any
  ) {
    // Calculate progress
    instance.progress = this.calculateProgress(instance);

    // Check if this is a terminal step
    if (currentTemplateStep.isTerminal || !currentTemplateStep.nextSteps?.length) {
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
      return;
    }

    // Handle condition steps
    if (currentTemplateStep.type === 'condition') {
      const nextStepId = await this.evaluateCondition(instance, currentTemplateStep);
      if (nextStepId) {
        await this.activateStep(instance, nextStepId, session);
      }
      return;
    }

    // Activate next step(s)
    for (const nextStepId of currentTemplateStep.nextSteps) {
      await this.activateStep(instance, nextStepId, session);
    }
  }

  /**
   * Activate a specific step
   */
  private static async activateStep(
    instance: IWorkflowInstance,
    stepId: string,
    session: any
  ) {
    const step = instance.steps.find(s => s.stepId === stepId);
    if (!step) return;

    step.status = 'active';
    step.startedAt = new Date();

    // Update instance current step
    instance.currentStepId = stepId;
    instance.currentStepName = step.stepName;

    // Resolve assignees for the new step
    const template = await WorkflowTemplate.findById(instance.templateId).session(session);
    if (template) {
      const templateStep = template.steps.find(s => s.stepId === stepId);
      if (templateStep) {
        const assignees = this.resolveAssignees(templateStep, instance.metadata);
        step.assignedTo = assignees;
        instance.currentAssignees = assignees;

        // Set due date based on SLA
        if (templateStep.sla) {
          step.dueAt = new Date(Date.now() + templateStep.sla.expectedHours * 3600000);
          step.slaWarningAt = new Date(Date.now() + templateStep.sla.warningHours * 3600000);
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
    }
  }

  /**
   * Evaluate condition step and return the next step ID
   */
  private static async evaluateCondition(
    instance: IWorkflowInstance,
    step: IWorkflowStep
  ): Promise<string | null> {
    if (!step.conditions?.length) return step.trueBranch || null;

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
   * Resolve assignees for a step based on configuration
   */
  private static resolveAssignees(
    step: IWorkflowStep,
    metadata?: Record<string, any>
  ): mongoose.Types.ObjectId[] {
    if (step.type === 'approval' && step.approverIds?.length) {
      return step.approverIds;
    }
    if (step.type === 'task' && step.taskConfig?.assigneeIds?.length) {
      return step.taskConfig.assigneeIds;
    }
    // Dynamic resolution would happen here based on metadata
    return [];
  }

  /**
   * Get required number of approvals for a step
   */
  private static getRequiredApprovals(step: IWorkflowStep): number {
    if (step.approvalMode === 'all') {
      return step.approverIds?.length || 1;
    }
    if (step.approvalMode === 'majority') {
      return Math.ceil((step.approverIds?.length || 1) / 2);
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
      performedBy: new mongoose.Types.ObjectId(), // System
      stepId,
      details: { escalationLevel: step.escalationLevel },
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
      if (step.status === 'pending' || step.status === 'active') {
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
      'steps.status': 'active',
      'steps.dueAt': { $lt: now },
      'steps.slaBreached': { $ne: true }
    });
  }
}

export default WorkflowEngine;
