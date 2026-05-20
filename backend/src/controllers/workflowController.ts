import { Request, Response } from 'express';
import WorkflowTemplate from '../models/WorkflowTemplate';
import WorkflowInstance from '../models/WorkflowInstance';
import WorkflowEngine from '../services/workflowEngine';
import { WorkflowProjectIntegration } from '../services/workflowProjectIntegration';
import { logger } from '../utils/logger';
import mongoose from 'mongoose';

// ==========================================
// WORKFLOW TEMPLATE CONTROLLERS
// ==========================================

/**
 * Create a new workflow template
 */
export const createTemplate = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { name, description, category, entityType, trigger, steps, departments, tags, priority, estimatedDurationHours } = req.body;

    // Validate steps have unique stepIds
    const stepIds = steps?.map((s: any) => s.stepId) || [];
    if (new Set(stepIds).size !== stepIds.length) {
      return res.status(400).json({ success: false, message: 'Step IDs must be unique' });
    }

    const template = new WorkflowTemplate({
      name,
      description,
      category,
      entityType,
      trigger,
      steps,
      departments,
      tags,
      priority,
      estimatedDurationHours,
      createdBy: req.user.id
    });

    await template.save();

    res.status(201).json({ success: true, data: template });
  } catch (error: any) {
    logger.error('Create workflow template error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * Get all workflow templates with filters
 */
export const getTemplates = async (req: Request, res: Response) => {
  try {
    const { category, entityType, isActive, page = 1, limit = 20, search } = req.query;

    const filter: any = {};
    if (category) filter.category = category;
    if (entityType) filter.entityType = entityType;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (search) filter.name = { $regex: search, $options: 'i' };

    const skip = (Number(page) - 1) * Number(limit);
    const [templates, total] = await Promise.all([
      WorkflowTemplate.find(filter)
        .populate('createdBy', 'name email')
        .populate('departments', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      WorkflowTemplate.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: templates,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error: any) {
    logger.error('Get workflow templates error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get a single workflow template by ID
 */
export const getTemplateById = async (req: Request, res: Response) => {
  try {
    const template = await WorkflowTemplate.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('departments', 'name')
      .populate('steps.approverIds', 'name email');

    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }

    res.json({ success: true, data: template });
  } catch (error: any) {
    logger.error('Get workflow template error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Update a workflow template
 */
export const updateTemplate = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const template = await WorkflowTemplate.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }

    // Check if there are active instances using this template
    const activeInstances = await WorkflowInstance.countDocuments({
      templateId: template._id,
      status: 'active'
    });

    if (activeInstances > 0) {
      // Create a new version instead of modifying
      template.version += 1;
    }

    const updates = req.body;
    updates.updatedBy = req.user.id;

    const updated = await WorkflowTemplate.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    res.json({ success: true, data: updated });
  } catch (error: any) {
    logger.error('Update workflow template error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * Delete a workflow template (soft delete - deactivate)
 */
export const deleteTemplate = async (req: Request, res: Response) => {
  try {
    const template = await WorkflowTemplate.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }

    // Check for active instances
    const activeInstances = await WorkflowInstance.countDocuments({
      templateId: template._id,
      status: 'active'
    });

    if (activeInstances > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete template with ${activeInstances} active workflow instances`
      });
    }

    template.isActive = false;
    await template.save();

    res.json({ success: true, message: 'Template deactivated successfully' });
  } catch (error: any) {
    logger.error('Delete workflow template error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Clone a workflow template
 */
export const cloneTemplate = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const source = await WorkflowTemplate.findById(req.params.id);
    if (!source) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }

    const cloned = new WorkflowTemplate({
      ...source.toObject(),
      _id: undefined,
      name: `${source.name} (Copy)`,
      version: 1,
      isDefault: false,
      createdBy: req.user.id,
      createdAt: undefined,
      updatedAt: undefined
    });

    await cloned.save();
    res.status(201).json({ success: true, data: cloned });
  } catch (error: any) {
    logger.error('Clone workflow template error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// WORKFLOW INSTANCE CONTROLLERS
// ==========================================

/**
 * Start a new workflow instance.
 * If entityType is 'project' and no entityId is provided, auto-creates the project.
 */
export const startWorkflow = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { templateId, entityType, entityId, entityTitle, projectId, departmentId, metadata, priority } = req.body;

    if (!templateId || !entityType) {
      return res.status(400).json({
        success: false,
        message: 'templateId and entityType are required'
      });
    }

    // Reverse flow: If entityType is 'project' and no entityId, auto-create the project
    if (entityType === 'project' && !entityId) {
      const { projectName, projectDescription, startDate, endDate, budget, currency, managers, team, departments, client, tags } = req.body;

      if (!projectName) {
        return res.status(400).json({
          success: false,
          message: 'projectName is required when creating a project from workflow'
        });
      }

      const result = await WorkflowProjectIntegration.onWorkflowInitiatedForProject(
        {
          templateId,
          projectName,
          projectDescription,
          startDate: startDate ? new Date(startDate) : undefined,
          endDate: endDate ? new Date(endDate) : undefined,
          budget,
          currency,
          priority,
          managers,
          team,
          departments,
          client,
          tags,
          metadata
        },
        req.user.id
      );

      return res.status(201).json({
        success: true,
        data: {
          workflowInstance: result.workflowInstance,
          project: result.project,
          autoCreated: true
        }
      });
    }

    // Standard flow: entityId must be provided
    if (!entityId || !entityTitle) {
      return res.status(400).json({
        success: false,
        message: 'entityId and entityTitle are required'
      });
    }

    const instance = await WorkflowEngine.startWorkflow({
      templateId,
      entityType,
      entityId,
      entityTitle,
      initiatedBy: req.user.id,
      projectId,
      departmentId,
      metadata,
      priority
    });

    res.status(201).json({ success: true, data: instance });
  } catch (error: any) {
    logger.error('Start workflow error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * Get all workflow instances with filters
 */
export const getInstances = async (req: Request, res: Response) => {
  try {
    const {
      status, entityType, projectId, departmentId, priority,
      initiatedBy, assignedTo, slaBreached,
      page = 1, limit = 20, search, sortBy = 'startedAt', sortOrder = 'desc'
    } = req.query;

    const filter: any = {};
    if (status) filter.status = status;
    if (entityType) filter.entityType = entityType;
    if (projectId) filter.projectId = projectId;
    if (departmentId) filter.departmentId = departmentId;
    if (priority) filter.priority = priority;
    if (initiatedBy) filter.initiatedBy = initiatedBy;
    if (assignedTo) filter.currentAssignees = assignedTo;
    if (slaBreached === 'true') filter.slaBreached = true;
    if (search) {
      filter.$or = [
        { templateName: { $regex: search, $options: 'i' } },
        { entityTitle: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const sort: any = { [sortBy as string]: sortOrder === 'asc' ? 1 : -1 };

    const [instances, total] = await Promise.all([
      WorkflowInstance.find(filter)
        .populate('initiatedBy', 'name email')
        .populate('currentAssignees', 'name email')
        .populate('projectId', 'name')
        .populate('departmentId', 'name')
        .sort(sort)
        .skip(skip)
        .limit(Number(limit)),
      WorkflowInstance.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: instances,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error: any) {
    logger.error('Get workflow instances error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get a single workflow instance with full details
 */
export const getInstanceById = async (req: Request, res: Response) => {
  try {
    const instance = await WorkflowInstance.findById(req.params.id)
      .populate('initiatedBy', 'name email avatar')
      .populate('currentAssignees', 'name email avatar')
      .populate('participants', 'name email avatar')
      .populate('projectId', 'name status')
      .populate('departmentId', 'name')
      .populate('templateId', 'name category steps')
      .populate('steps.assignedTo', 'name email')
      .populate('steps.approvals.userId', 'name email')
      .populate('comments.userId', 'name email avatar')
      .populate('auditTrail.performedBy', 'name email');

    if (!instance) {
      return res.status(404).json({ success: false, message: 'Workflow instance not found' });
    }

    res.json({ success: true, data: instance });
  } catch (error: any) {
    logger.error('Get workflow instance error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get my pending workflow actions (assigned to current user)
 */
export const getMyPendingActions = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const instances = await WorkflowInstance.find({
      status: 'active',
      currentAssignees: req.user.id
    })
      .populate('initiatedBy', 'name email')
      .populate('projectId', 'name')
      .sort({ priority: -1, startedAt: -1 });

    res.json({ success: true, data: instances });
  } catch (error: any) {
    logger.error('Get my pending actions error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get workflows for a specific entity
 */
export const getEntityWorkflows = async (req: Request, res: Response) => {
  try {
    const { entityType, entityId } = req.params;

    const instances = await WorkflowInstance.find({ entityType, entityId })
      .populate('initiatedBy', 'name email')
      .populate('currentAssignees', 'name email')
      .sort({ startedAt: -1 });

    res.json({ success: true, data: instances });
  } catch (error: any) {
    logger.error('Get entity workflows error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Process a step action (approve, reject, complete, delegate, skip)
 */
export const processStepAction = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { id: instanceId, stepId } = req.params;
    const { action, comments, delegateTo, resultData } = req.body;

    if (!['approve', 'reject', 'complete', 'delegate', 'skip'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Must be: approve, reject, complete, delegate, or skip'
      });
    }

    const instance = await WorkflowEngine.processStepAction({
      instanceId,
      stepId,
      action,
      userId: req.user.id,
      comments,
      delegateTo,
      resultData
    });

    res.json({ success: true, data: instance });
  } catch (error: any) {
    logger.error('Process step action error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * Add a comment to a workflow instance
 */
export const addComment = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { comment, stepId, attachments } = req.body;
    if (!comment) {
      return res.status(400).json({ success: false, message: 'Comment is required' });
    }

    const instance = await WorkflowInstance.findById(req.params.id);
    if (!instance) {
      return res.status(404).json({ success: false, message: 'Workflow instance not found' });
    }

    instance.comments.push({
      userId: req.user.id,
      stepId,
      comment,
      attachments,
      timestamp: new Date()
    });

    await instance.save();
    res.json({ success: true, data: instance });
  } catch (error: any) {
    logger.error('Add workflow comment error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Cancel a workflow instance
 */
export const cancelWorkflow = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { reason } = req.body;
    if (!reason) {
      return res.status(400).json({ success: false, message: 'Cancellation reason is required' });
    }

    const instance = await WorkflowEngine.cancelWorkflow(req.params.id, req.user.id, reason);
    res.json({ success: true, data: instance });
  } catch (error: any) {
    logger.error('Cancel workflow error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * Put workflow on hold
 */
export const holdWorkflow = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const instance = await WorkflowEngine.holdWorkflow(req.params.id, req.user.id, req.body.reason);
    res.json({ success: true, data: instance });
  } catch (error: any) {
    logger.error('Hold workflow error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * Resume workflow from hold
 */
export const resumeWorkflow = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const instance = await WorkflowEngine.resumeWorkflow(req.params.id, req.user.id);
    res.json({ success: true, data: instance });
  } catch (error: any) {
    logger.error('Resume workflow error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// ==========================================
// WORKFLOW ANALYTICS & DASHBOARD
// ==========================================

/**
 * Get workflow dashboard stats
 */
export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const { projectId, departmentId, dateFrom, dateTo } = req.query;

    const matchFilter: any = {};
    if (projectId) matchFilter.projectId = new mongoose.Types.ObjectId(projectId as string);
    if (departmentId) matchFilter.departmentId = new mongoose.Types.ObjectId(departmentId as string);
    if (dateFrom || dateTo) {
      matchFilter.startedAt = {};
      if (dateFrom) matchFilter.startedAt.$gte = new Date(dateFrom as string);
      if (dateTo) matchFilter.startedAt.$lte = new Date(dateTo as string);
    }

    const [statusCounts, priorityCounts, avgCompletionTime, slaStats, recentActivity] = await Promise.all([
      // Status distribution
      WorkflowInstance.aggregate([
        { $match: matchFilter },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      // Priority distribution
      WorkflowInstance.aggregate([
        { $match: { ...matchFilter, status: 'active' } },
        { $group: { _id: '$priority', count: { $sum: 1 } } }
      ]),
      // Average completion time (in hours)
      WorkflowInstance.aggregate([
        { $match: { ...matchFilter, status: 'completed', completedAt: { $exists: true } } },
        {
          $project: {
            duration: { $subtract: ['$completedAt', '$startedAt'] }
          }
        },
        { $group: { _id: null, avgDuration: { $avg: '$duration' } } }
      ]),
      // SLA breach stats
      WorkflowInstance.aggregate([
        { $match: matchFilter },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            breached: { $sum: { $cond: ['$slaBreached', 1, 0] } }
          }
        }
      ]),
      // Recent activity (last 10)
      WorkflowInstance.find(matchFilter)
        .sort({ updatedAt: -1 })
        .limit(10)
        .select('templateName entityTitle status priority currentStepName updatedAt')
        .populate('initiatedBy', 'name')
    ]);

    const stats = {
      statusDistribution: statusCounts.reduce((acc: any, item: any) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      priorityDistribution: priorityCounts.reduce((acc: any, item: any) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      avgCompletionTimeHours: avgCompletionTime[0]
        ? Math.round(avgCompletionTime[0].avgDuration / 3600000)
        : 0,
      sla: {
        total: slaStats[0]?.total || 0,
        breached: slaStats[0]?.breached || 0,
        complianceRate: slaStats[0]?.total
          ? Math.round(((slaStats[0].total - slaStats[0].breached) / slaStats[0].total) * 100)
          : 100
      },
      recentActivity
    };

    res.json({ success: true, data: stats });
  } catch (error: any) {
    logger.error('Get workflow dashboard stats error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get workflow performance report by template
 */
export const getPerformanceReport = async (req: Request, res: Response) => {
  try {
    const { dateFrom, dateTo } = req.query;

    const matchFilter: any = { status: 'completed' };
    if (dateFrom || dateTo) {
      matchFilter.completedAt = {};
      if (dateFrom) matchFilter.completedAt.$gte = new Date(dateFrom as string);
      if (dateTo) matchFilter.completedAt.$lte = new Date(dateTo as string);
    }

    const report = await WorkflowInstance.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$templateId',
          templateName: { $first: '$templateName' },
          totalCompleted: { $sum: 1 },
          avgDuration: { $avg: { $subtract: ['$completedAt', '$startedAt'] } },
          slaBreaches: { $sum: { $cond: ['$slaBreached', 1, 0] } },
          avgProgress: { $avg: '$progress' }
        }
      },
      { $sort: { totalCompleted: -1 } }
    ]);

    const formattedReport = report.map(item => ({
      templateId: item._id,
      templateName: item.templateName,
      totalCompleted: item.totalCompleted,
      avgDurationHours: Math.round(item.avgDuration / 3600000),
      slaBreaches: item.slaBreaches,
      slaComplianceRate: Math.round(((item.totalCompleted - item.slaBreaches) / item.totalCompleted) * 100)
    }));

    res.json({ success: true, data: formattedReport });
  } catch (error: any) {
    logger.error('Get workflow performance report error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get bottleneck analysis - which steps take the longest
 */
export const getBottleneckAnalysis = async (req: Request, res: Response) => {
  try {
    const { templateId } = req.query;

    const matchFilter: any = { status: 'completed' };
    if (templateId) matchFilter.templateId = new mongoose.Types.ObjectId(templateId as string);

    const analysis = await WorkflowInstance.aggregate([
      { $match: matchFilter },
      { $unwind: '$steps' },
      { $match: { 'steps.status': 'completed', 'steps.startedAt': { $exists: true }, 'steps.completedAt': { $exists: true } } },
      {
        $group: {
          _id: { stepId: '$steps.stepId', stepName: '$steps.stepName', stepType: '$steps.stepType' },
          avgDuration: { $avg: { $subtract: ['$steps.completedAt', '$steps.startedAt'] } },
          maxDuration: { $max: { $subtract: ['$steps.completedAt', '$steps.startedAt'] } },
          count: { $sum: 1 },
          slaBreaches: { $sum: { $cond: ['$steps.slaBreached', 1, 0] } }
        }
      },
      { $sort: { avgDuration: -1 } },
      { $limit: 20 }
    ]);

    const formattedAnalysis = analysis.map(item => ({
      stepId: item._id.stepId,
      stepName: item._id.stepName,
      stepType: item._id.stepType,
      avgDurationHours: Math.round(item.avgDuration / 3600000 * 10) / 10,
      maxDurationHours: Math.round(item.maxDuration / 3600000 * 10) / 10,
      executionCount: item.count,
      slaBreaches: item.slaBreaches
    }));

    res.json({ success: true, data: formattedAnalysis });
  } catch (error: any) {
    logger.error('Get bottleneck analysis error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
