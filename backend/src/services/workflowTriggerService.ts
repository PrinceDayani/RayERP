import WorkflowTemplate, { EntityType, ICondition } from '../models/WorkflowTemplate';
import WorkflowEngine from './workflowEngine';
import { logger } from '../utils/logger';

/**
 * WorkflowTriggerService - Evaluates and fires workflow triggers automatically.
 * Call this from other modules when entities are created, updated, or change status.
 */
export class WorkflowTriggerService {

  /**
   * Check and trigger workflows when an entity is created
   */
  static async onEntityCreated(params: {
    entityType: EntityType;
    entityId: string;
    entityTitle: string;
    createdBy: string;
    projectId?: string;
    departmentId?: string;
    entityData?: Record<string, any>;
  }): Promise<void> {
    try {
      const templates = await WorkflowTemplate.find({
        entityType: params.entityType,
        isActive: true,
        'trigger.type': 'entity-created'
      });

      for (const template of templates) {
        // Evaluate trigger conditions
        if (template.trigger.conditions?.length) {
          const conditionsMet = template.trigger.conditions.every(condition =>
            this.evaluateCondition(condition, params.entityData || {})
          );
          if (!conditionsMet) continue;
        }

        // Start the workflow
        await WorkflowEngine.startWorkflow({
          templateId: template._id.toString(),
          entityType: params.entityType,
          entityId: params.entityId,
          entityTitle: params.entityTitle,
          initiatedBy: params.createdBy,
          projectId: params.projectId,
          departmentId: params.departmentId,
          metadata: params.entityData
        });

        logger.info(`Auto-triggered workflow "${template.name}" for new ${params.entityType}: ${params.entityTitle}`);
      }
    } catch (error) {
      logger.error('Workflow trigger (entity-created) error:', error);
    }
  }

  /**
   * Check and trigger workflows when an entity status changes
   */
  static async onStatusChanged(params: {
    entityType: EntityType;
    entityId: string;
    entityTitle: string;
    changedBy: string;
    statusFrom: string;
    statusTo: string;
    projectId?: string;
    departmentId?: string;
    entityData?: Record<string, any>;
  }): Promise<void> {
    try {
      const templates = await WorkflowTemplate.find({
        entityType: params.entityType,
        isActive: true,
        'trigger.type': 'status-changed'
      });

      for (const template of templates) {
        // Check status transition match
        if (template.trigger.statusFrom && template.trigger.statusFrom !== params.statusFrom) continue;
        if (template.trigger.statusTo && template.trigger.statusTo !== params.statusTo) continue;

        // Evaluate additional conditions
        if (template.trigger.conditions?.length) {
          const conditionsMet = template.trigger.conditions.every(condition =>
            this.evaluateCondition(condition, params.entityData || {})
          );
          if (!conditionsMet) continue;
        }

        await WorkflowEngine.startWorkflow({
          templateId: template._id.toString(),
          entityType: params.entityType,
          entityId: params.entityId,
          entityTitle: params.entityTitle,
          initiatedBy: params.changedBy,
          projectId: params.projectId,
          departmentId: params.departmentId,
          metadata: { ...params.entityData, statusFrom: params.statusFrom, statusTo: params.statusTo }
        });

        logger.info(`Auto-triggered workflow "${template.name}" on status change: ${params.statusFrom} → ${params.statusTo}`);
      }
    } catch (error) {
      logger.error('Workflow trigger (status-changed) error:', error);
    }
  }

  /**
   * Check and trigger workflows when an entity is updated
   */
  static async onEntityUpdated(params: {
    entityType: EntityType;
    entityId: string;
    entityTitle: string;
    updatedBy: string;
    changedFields: string[];
    projectId?: string;
    departmentId?: string;
    entityData?: Record<string, any>;
  }): Promise<void> {
    try {
      const templates = await WorkflowTemplate.find({
        entityType: params.entityType,
        isActive: true,
        'trigger.type': 'entity-updated'
      });

      for (const template of templates) {
        // Evaluate conditions (check if relevant fields changed)
        if (template.trigger.conditions?.length) {
          const conditionsMet = template.trigger.conditions.every(condition =>
            this.evaluateCondition(condition, params.entityData || {})
          );
          if (!conditionsMet) continue;
        }

        await WorkflowEngine.startWorkflow({
          templateId: template._id.toString(),
          entityType: params.entityType,
          entityId: params.entityId,
          entityTitle: params.entityTitle,
          initiatedBy: params.updatedBy,
          projectId: params.projectId,
          departmentId: params.departmentId,
          metadata: { ...params.entityData, changedFields: params.changedFields }
        });

        logger.info(`Auto-triggered workflow "${template.name}" on entity update: ${params.entityTitle}`);
      }
    } catch (error) {
      logger.error('Workflow trigger (entity-updated) error:', error);
    }
  }

  /**
   * Check and trigger workflows when amount exceeds threshold
   */
  static async onAmountThreshold(params: {
    entityType: EntityType;
    entityId: string;
    entityTitle: string;
    triggeredBy: string;
    amount: number;
    projectId?: string;
    departmentId?: string;
    entityData?: Record<string, any>;
  }): Promise<void> {
    try {
      const templates = await WorkflowTemplate.find({
        entityType: params.entityType,
        isActive: true,
        'trigger.type': 'amount-threshold',
        'trigger.amountThreshold': { $lte: params.amount }
      });

      for (const template of templates) {
        await WorkflowEngine.startWorkflow({
          templateId: template._id.toString(),
          entityType: params.entityType,
          entityId: params.entityId,
          entityTitle: params.entityTitle,
          initiatedBy: params.triggeredBy,
          projectId: params.projectId,
          departmentId: params.departmentId,
          metadata: { ...params.entityData, amount: params.amount },
          priority: params.amount > 1000000 ? 'critical' : params.amount > 500000 ? 'high' : 'medium'
        });

        logger.info(`Auto-triggered workflow "${template.name}" on amount threshold: ₹${params.amount}`);
      }
    } catch (error) {
      logger.error('Workflow trigger (amount-threshold) error:', error);
    }
  }

  /**
   * Evaluate a single condition against entity data
   */
  private static evaluateCondition(condition: ICondition, data: Record<string, any>): boolean {
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

  private static getNestedValue(obj: Record<string, any>, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
}

export default WorkflowTriggerService;
