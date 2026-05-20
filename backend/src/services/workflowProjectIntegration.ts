import mongoose from 'mongoose';
import WorkflowTemplate from '../models/WorkflowTemplate';
import WorkflowInstance from '../models/WorkflowInstance';
import Project from '../models/Project';
import Task from '../models/Task';
import { WorkflowEngine } from './workflowEngine';
import { logger } from '../utils/logger';

/**
 * WorkflowProjectIntegration - Bidirectional integration between Workflow and Project modules.
 * 
 * Handles:
 * 1. Project Created → Auto-generate workflow instance
 * 2. Workflow Created (for project entity) → Auto-generate project
 * 3. Workflow completion → Update project status
 * 4. Workflow rejection/cancellation → Sync project status
 * 5. Project cancellation → Cancel active workflows
 * 6. Task creation from workflow task-type steps
 */
export class WorkflowProjectIntegration {

  /**
   * Called after a project is created.
   * Finds the default project workflow template and starts an instance.
   * 
   * @param projectId - The created project's ID
   * @param userId - The user who created the project
   * @param options - Optional overrides
   * @returns The created workflow instance, or null if skipped
   */
  static async onProjectCreated(
    projectId: string,
    userId: string,
    options: {
      skipWorkflow?: boolean;
      workflowTemplateId?: string;
      departmentId?: string;
      metadata?: Record<string, any>;
    } = {}
  ): Promise<{ workflowInstance: any | null; error?: string }> {
    try {
      if (options.skipWorkflow) {
        logger.info(`Workflow skipped for project ${projectId} by user ${userId}`);
        return { workflowInstance: null };
      }

      // Fetch the project
      const project = await Project.findById(projectId);
      if (!project) {
        return { workflowInstance: null, error: 'Project not found' };
      }

      // Find the workflow template to use
      let template;
      if (options.workflowTemplateId) {
        // User specified a template
        template = await WorkflowTemplate.findOne({
          _id: options.workflowTemplateId,
          entityType: 'project',
          isActive: true
        });
      } else {
        // Use the default project workflow template
        template = await WorkflowTemplate.findOne({
          entityType: 'project',
          isDefault: true,
          isActive: true
        });
      }

      if (!template) {
        logger.warn(`No active project workflow template found for project ${projectId}`);
        return { workflowInstance: null, error: 'No active workflow template found for projects' };
      }

      // Start the workflow instance
      const workflowInstance = await WorkflowEngine.startWorkflow({
        templateId: template._id.toString(),
        entityType: 'project',
        entityId: projectId,
        entityTitle: project.name,
        initiatedBy: userId,
        projectId: projectId,
        departmentId: options.departmentId || (project.departments?.[0]?.toString()),
        priority: project.priority as 'low' | 'medium' | 'high' | 'critical',
        metadata: {
          projectName: project.name,
          projectBudget: project.budget,
          projectPriority: project.priority,
          projectStatus: project.status,
          projectManagers: project.managers?.map(m => m.toString()),
          projectDepartments: project.departments?.map(d => d.toString()),
          ...options.metadata
        }
      });

      // Update project with workflow reference
      await Project.findByIdAndUpdate(projectId, {
        $set: {
          workflowInstanceId: workflowInstance._id,
          workflowStatus: 'active'
        }
      });

      logger.info(`Workflow "${template.name}" auto-started for project "${project.name}" (${projectId})`);

      // Create tasks for the first step if it's a task-type step
      await this.createTaskForActiveStep(workflowInstance, userId);

      return { workflowInstance };
    } catch (error) {
      logger.error(`Error starting workflow for project ${projectId}:`, error);
      return { workflowInstance: null, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Called when a workflow is started for entity type "project" without an existing project.
   * Auto-creates the project from workflow metadata.
   * 
   * @param workflowMetadata - Data to create the project from
   * @param userId - The user initiating the workflow
   * @returns The created project and workflow instance
   */
  static async onWorkflowInitiatedForProject(
    workflowMetadata: {
      templateId: string;
      projectName: string;
      projectDescription?: string;
      startDate?: Date;
      endDate?: Date;
      budget?: number;
      currency?: string;
      priority?: 'low' | 'medium' | 'high' | 'critical';
      managers?: string[];
      team?: string[];
      departments?: string[];
      client?: string;
      tags?: string[];
      metadata?: Record<string, any>;
    },
    userId: string
  ): Promise<{ project: any; workflowInstance: any }> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Create the project
      const projectData = {
        name: workflowMetadata.projectName,
        description: workflowMetadata.projectDescription || `Project created from workflow`,
        status: 'planning', // Starts in planning, workflow will activate it
        priority: workflowMetadata.priority || 'medium',
        startDate: workflowMetadata.startDate || new Date(),
        endDate: workflowMetadata.endDate || new Date(Date.now() + 90 * 24 * 3600000), // Default 90 days
        budget: workflowMetadata.budget || 0,
        currency: workflowMetadata.currency || 'INR',
        managers: workflowMetadata.managers?.map(id => new mongoose.Types.ObjectId(id)) || [],
        team: workflowMetadata.team?.map(id => new mongoose.Types.ObjectId(id)) || [],
        departments: workflowMetadata.departments?.map(id => new mongoose.Types.ObjectId(id)) || [],
        client: workflowMetadata.client,
        tags: workflowMetadata.tags || [],
        owner: new mongoose.Types.ObjectId(userId)
      };

      const project = new Project(projectData);
      await project.save({ session });

      // Find the workflow template
      const template = await WorkflowTemplate.findById(workflowMetadata.templateId).session(session);
      if (!template) throw new Error('Workflow template not found');
      if (!template.isActive) throw new Error('Workflow template is not active');
      if (template.entityType !== 'project') throw new Error('Template is not a project workflow');

      await session.commitTransaction();
      session.endSession();

      // Start the workflow (uses its own session internally)
      const workflowInstance = await WorkflowEngine.startWorkflow({
        templateId: template._id.toString(),
        entityType: 'project',
        entityId: project._id.toString(),
        entityTitle: project.name,
        initiatedBy: userId,
        projectId: project._id.toString(),
        departmentId: workflowMetadata.departments?.[0],
        priority: project.priority as 'low' | 'medium' | 'high' | 'critical',
        metadata: {
          projectName: project.name,
          projectBudget: project.budget,
          projectPriority: project.priority,
          projectStatus: project.status,
          projectManagers: workflowMetadata.managers,
          projectDepartments: workflowMetadata.departments,
          ...workflowMetadata.metadata
        }
      });

      // Update project with workflow reference
      await Project.findByIdAndUpdate(project._id, {
        $set: {
          workflowInstanceId: workflowInstance._id,
          workflowStatus: 'active'
        }
      });

      // Create tasks for the first step if applicable
      await this.createTaskForActiveStep(workflowInstance, userId);

      logger.info(`Project "${project.name}" auto-created from workflow "${template.name}"`);

      return { project, workflowInstance };
    } catch (error) {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }
      session.endSession();
      throw error;
    }
  }

  /**
   * Called when a workflow reaches its terminal step and completes.
   * Updates the project status based on the workflow's auto-action configuration.
   */
  static async onWorkflowCompleted(instanceId: string): Promise<void> {
    try {
      const instance = await WorkflowInstance.findById(instanceId);
      if (!instance || instance.entityType !== 'project') return;

      const template = await WorkflowTemplate.findById(instance.templateId);
      if (!template) return;

      // Find the terminal step's auto-action for status change
      const terminalStep = template.steps.find(s => s.isTerminal);
      let newStatus: string | null = null;

      if (terminalStep?.actions?.length) {
        const statusAction = terminalStep.actions.find(a => a.type === 'change-status');
        if (statusAction) {
          newStatus = statusAction.config.newStatus;
        }
      }

      // Update project status
      const updateData: any = {
        workflowStatus: 'completed'
      };
      if (newStatus) {
        updateData.status = newStatus;
      }

      await Project.findByIdAndUpdate(instance.entityId, { $set: updateData });

      logger.info(`Project ${instance.entityId} updated to status "${newStatus || 'unchanged'}" after workflow completion`);
    } catch (error) {
      logger.error(`Error updating project after workflow completion:`, error);
    }
  }

  /**
   * Called when a workflow is rejected.
   * Sets the project to on-hold with the rejection reason.
   */
  static async onWorkflowRejected(instanceId: string): Promise<void> {
    try {
      const instance = await WorkflowInstance.findById(instanceId);
      if (!instance || instance.entityType !== 'project') return;

      await Project.findByIdAndUpdate(instance.entityId, {
        $set: {
          status: 'on-hold',
          workflowStatus: 'rejected'
        }
      });

      logger.info(`Project ${instance.entityId} set to on-hold after workflow rejection`);
    } catch (error) {
      logger.error(`Error updating project after workflow rejection:`, error);
    }
  }

  /**
   * Called when a workflow is cancelled.
   * Updates the project workflow status (does not cancel the project itself).
   */
  static async onWorkflowCancelled(instanceId: string): Promise<void> {
    try {
      const instance = await WorkflowInstance.findById(instanceId);
      if (!instance || instance.entityType !== 'project') return;

      await Project.findByIdAndUpdate(instance.entityId, {
        $set: {
          workflowStatus: 'cancelled',
          workflowInstanceId: null
        }
      });

      logger.info(`Project ${instance.entityId} workflow status cleared after workflow cancellation`);
    } catch (error) {
      logger.error(`Error updating project after workflow cancellation:`, error);
    }
  }

  /**
   * Called when a project is cancelled.
   * Cancels any active workflow instances for that project.
   */
  static async onProjectCancelled(projectId: string, userId: string): Promise<void> {
    try {
      const activeInstances = await WorkflowInstance.find({
        entityType: 'project',
        entityId: projectId,
        status: { $in: ['active', 'on-hold'] }
      });

      for (const instance of activeInstances) {
        await WorkflowEngine.cancelWorkflow(
          instance._id.toString(),
          userId,
          'Project was cancelled'
        );
      }

      if (activeInstances.length > 0) {
        logger.info(`Cancelled ${activeInstances.length} workflow(s) for cancelled project ${projectId}`);
      }
    } catch (error) {
      logger.error(`Error cancelling workflows for project ${projectId}:`, error);
    }
  }

  /**
   * Called when a project status changes.
   * Syncs relevant workflow state.
   */
  static async onProjectStatusChanged(
    projectId: string,
    oldStatus: string,
    newStatus: string,
    userId: string
  ): Promise<void> {
    try {
      if (newStatus === 'cancelled') {
        await this.onProjectCancelled(projectId, userId);
        return;
      }

      if (newStatus === 'on-hold') {
        // Put active workflows on hold
        const activeInstances = await WorkflowInstance.find({
          entityType: 'project',
          entityId: projectId,
          status: 'active'
        });

        for (const instance of activeInstances) {
          await WorkflowEngine.holdWorkflow(
            instance._id.toString(),
            userId,
            `Project status changed to on-hold`
          );
        }
      }

      if (oldStatus === 'on-hold' && newStatus === 'active') {
        // Resume held workflows
        const heldInstances = await WorkflowInstance.find({
          entityType: 'project',
          entityId: projectId,
          status: 'on-hold'
        });

        for (const instance of heldInstances) {
          await WorkflowEngine.resumeWorkflow(instance._id.toString(), userId);
        }
      }
    } catch (error) {
      logger.error(`Error syncing workflow on project status change:`, error);
    }
  }

  /**
   * Creates a Task document when a workflow step of type "task" becomes active.
   */
  static async createTaskForActiveStep(
    workflowInstance: any,
    userId: string
  ): Promise<void> {
    try {
      const template = await WorkflowTemplate.findById(workflowInstance.templateId);
      if (!template) return;

      const activeStep = workflowInstance.steps.find((s: any) => s.status === 'active');
      if (!activeStep) return;

      const templateStep = template.steps.find(s => s.stepId === activeStep.stepId);
      if (!templateStep || templateStep.type !== 'task' || !templateStep.taskConfig) return;

      const { taskConfig } = templateStep;

      // Determine assignee
      let assigneeId = userId; // Default to initiator
      if (taskConfig.assigneeIds?.length) {
        assigneeId = taskConfig.assigneeIds[0].toString();
      } else if (activeStep.assignedTo?.length) {
        assigneeId = activeStep.assignedTo[0].toString();
      }

      // Calculate due date
      const dueDate = taskConfig.dueInDays
        ? new Date(Date.now() + taskConfig.dueInDays * 24 * 3600000)
        : new Date(Date.now() + 7 * 24 * 3600000); // Default 7 days

      // Create the task
      const task = new Task({
        title: taskConfig.title,
        description: taskConfig.description || `Workflow task: ${templateStep.name}`,
        taskType: workflowInstance.entityType === 'project' ? 'project' : 'individual',
        assignmentType: 'assigned',
        status: 'todo',
        priority: taskConfig.priority || 'medium',
        project: workflowInstance.entityType === 'project' ? workflowInstance.entityId : undefined,
        assignedTo: new mongoose.Types.ObjectId(assigneeId),
        assignedBy: new mongoose.Types.ObjectId(userId),
        dueDate,
        tags: [{ name: 'workflow', color: '#8b5cf6' }],
        customFields: [
          { fieldName: 'workflowInstanceId', fieldType: 'text', value: workflowInstance._id.toString() },
          { fieldName: 'workflowStepId', fieldType: 'text', value: activeStep.stepId }
        ]
      });

      await task.save();

      // Update the workflow step with the task reference
      await WorkflowInstance.updateOne(
        { _id: workflowInstance._id, 'steps.stepId': activeStep.stepId },
        { $set: { 'steps.$.taskId': task._id } }
      );

      logger.info(`Task "${task.title}" created for workflow step "${templateStep.name}"`);
    } catch (error) {
      logger.error(`Error creating task for workflow step:`, error);
    }
  }

  /**
   * Get the active workflow for a project.
   */
  static async getProjectWorkflow(projectId: string): Promise<any> {
    return WorkflowInstance.findOne({
      entityType: 'project',
      entityId: projectId,
      status: { $in: ['active', 'on-hold'] }
    }).populate('currentAssignees', 'name email');
  }

  /**
   * Get all workflows (including completed) for a project.
   */
  static async getProjectWorkflowHistory(projectId: string): Promise<any[]> {
    return WorkflowInstance.find({
      entityType: 'project',
      entityId: projectId
    }).sort({ startedAt: -1 });
  }

  /**
   * Restart a workflow for a project (e.g., after rejection, user wants to retry).
   */
  static async restartProjectWorkflow(
    projectId: string,
    userId: string,
    templateId?: string
  ): Promise<{ workflowInstance: any | null; error?: string }> {
    // Cancel any existing active workflow first
    await this.onProjectCancelled(projectId, userId);

    // Start fresh
    return this.onProjectCreated(projectId, userId, {
      workflowTemplateId: templateId
    });
  }
}

export default WorkflowProjectIntegration;
