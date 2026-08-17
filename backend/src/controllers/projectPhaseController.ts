//path: backend/src/controllers/projectPhaseController.ts

import { Request, Response } from 'express';
import mongoose from 'mongoose';
import ProjectPhase from '../models/ProjectPhase';
import Project from '../models/Project';
import MilestoneBilling from '../models/MilestoneBilling';
import WorkflowInstance from '../models/WorkflowInstance';
import { WorkflowEngine } from '../services/workflowEngine';
import { WorkflowProjectIntegration } from '../services/workflowProjectIntegration';
import { canManageWorkflows } from '../middleware/rbac.middleware';
import { logger } from '../utils/logger';

const isInvalidId = (id: any) => !id || !mongoose.isValidObjectId(String(id));

const MAX_PAGE_LIMIT = 50;

// Statuses a user may set directly. Review outcomes are owned by the workflow
// engine and must not be settable through a plain update.
const USER_SETTABLE_STATUSES = ['draft', 'in-progress', 'completed', 'on-hold', 'cancelled'];

// Whitelisted to prevent mass-assignment onto review/ownership fields
const UPDATABLE_FIELDS = [
  'name', 'description', 'startDate', 'endDate', 'actualStartDate', 'actualEndDate',
  'budget', 'spentBudget', 'progress', 'autoCalculateProgress', 'deliverables',
  'dependsOn', 'reviewDepartments', 'reviewTemplate', 'owner', 'tags'
];

const parsePagination = (query: any) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(MAX_PAGE_LIMIT, Math.max(1, Number(query.limit) || 20));
  return { page, limit, skip: (page - 1) * limit };
};

const objectIdArray = (value: any): mongoose.Types.ObjectId[] =>
  (Array.isArray(value) ? value : [])
    .filter((id: any) => mongoose.isValidObjectId(String(id)))
    .map((id: any) => new mongoose.Types.ObjectId(String(id)));

/**
 * GET /api/projects/:id/phases
 */
export const listProjectPhases = async (req: Request, res: Response) => {
  try {
    const phases = await ProjectPhase.find({ project: req.params.id })
      .sort({ order: 1 })
      .populate('reviewDepartments', 'name')
      .populate('reviewSummary.decidedBy', 'name email')
      .populate('owner', 'name email')
      .lean();

    res.json({ success: true, data: phases });
  } catch (error: any) {
    logger.error('List project phases error:', error);
    res.status(500).json({ success: false, message: 'Failed to load phases' });
  }
};

/**
 * POST /api/projects/:id/phases
 */
export const createProjectPhase = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { name } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Phase name is required' });
    }

    const project = await Project.findById(req.params.id).select('_id');
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const last = await ProjectPhase.findOne({ project: project._id }).sort({ order: -1 }).select('order').lean();
    const order = Number.isFinite(Number(req.body.order))
      ? Number(req.body.order)
      : (last ? last.order + 1 : 0);

    const phase = await ProjectPhase.create({
      project: project._id,
      name: name.trim(),
      description: req.body.description?.trim(),
      order,
      startDate: req.body.startDate ? new Date(req.body.startDate) : undefined,
      endDate: req.body.endDate ? new Date(req.body.endDate) : undefined,
      budget: parseFloat(req.body.budget) || 0,
      milestones: Array.isArray(req.body.milestones) ? req.body.milestones : [],
      deliverables: Array.isArray(req.body.deliverables) ? req.body.deliverables : [],
      dependsOn: objectIdArray(req.body.dependsOn),
      reviewDepartments: objectIdArray(req.body.reviewDepartments),
      owner: mongoose.isValidObjectId(String(req.body.owner)) ? req.body.owner : undefined,
      tags: Array.isArray(req.body.tags) ? req.body.tags : [],
      createdBy: req.user._id
    });

    const { io } = await import('../server');
    io.emit('project:phases:updated', { projectId: project._id.toString() });

    res.status(201).json({ success: true, data: phase });
  } catch (error: any) {
    if (error?.code === 11000) {
      return res.status(409).json({ success: false, message: 'A phase already exists at that position' });
    }
    logger.error('Create project phase error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * PUT /api/projects/:id/phases/reorder
 * Body: { order: [phaseId, ...] } — index in the array becomes the phase order.
 */
export const reorderProjectPhases = async (req: Request, res: Response) => {
  try {
    const { order } = req.body;
    if (!Array.isArray(order) || order.some(id => isInvalidId(id))) {
      return res.status(400).json({ success: false, message: 'order must be an array of phase ids' });
    }

    const phases = await ProjectPhase.find({ project: req.params.id }).select('_id').lean();
    const known = new Set(phases.map(p => p._id.toString()));
    if (order.length !== phases.length || order.some(id => !known.has(String(id)))) {
      return res.status(400).json({
        success: false,
        message: 'order must list every phase of this project exactly once'
      });
    }

    // (project, order) is unique, so park the rows on negative slots first —
    // otherwise an intermediate state collides with a not-yet-moved phase
    await ProjectPhase.bulkWrite(order.map((id, index) => ({
      updateOne: { filter: { _id: id }, update: { $set: { order: -(index + 1) } } }
    })));
    await ProjectPhase.bulkWrite(order.map((id, index) => ({
      updateOne: { filter: { _id: id }, update: { $set: { order: index } } }
    })));

    const updated = await ProjectPhase.find({ project: req.params.id }).sort({ order: 1 }).lean();

    const { io } = await import('../server');
    io.emit('project:phases:updated', { projectId: req.params.id });

    res.json({ success: true, data: updated });
  } catch (error: any) {
    logger.error('Reorder project phases error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/phases/:id
 */
export const getPhaseById = async (req: Request, res: Response) => {
  try {
    const phase = await ProjectPhase.findById(req.params.id)
      .populate('project', 'name status currency')
      .populate('reviewDepartments', 'name')
      .populate('reviewSummary.decidedBy', 'name email')
      .populate('submittedForReviewBy', 'name email')
      .populate('owner', 'name email')
      .lean();

    if (!phase) {
      return res.status(404).json({ success: false, message: 'Phase not found' });
    }

    res.json({ success: true, data: phase });
  } catch (error: any) {
    logger.error('Get phase error:', error);
    res.status(500).json({ success: false, message: 'Failed to load phase' });
  }
};

/**
 * PUT /api/phases/:id
 */
export const updatePhase = async (req: Request, res: Response) => {
  try {
    const phase = await ProjectPhase.findById(req.params.id);
    if (!phase) {
      return res.status(404).json({ success: false, message: 'Phase not found' });
    }

    if (phase.status === 'in-review') {
      return res.status(409).json({
        success: false,
        message: 'Phase is under review; withdraw the review before editing'
      });
    }

    for (const field of UPDATABLE_FIELDS) {
      if (!(field in req.body)) continue;
      const value = req.body[field];

      if (field === 'dependsOn' || field === 'reviewDepartments') {
        (phase as any)[field] = objectIdArray(value);
      } else if (field === 'startDate' || field === 'endDate' || field === 'actualStartDate' || field === 'actualEndDate') {
        (phase as any)[field] = value ? new Date(value) : undefined;
      } else {
        (phase as any)[field] = value;
      }
    }

    if ('status' in req.body) {
      if (!USER_SETTABLE_STATUSES.includes(req.body.status)) {
        return res.status(400).json({
          success: false,
          message: `status must be one of: ${USER_SETTABLE_STATUSES.join(', ')}`
        });
      }
      phase.status = req.body.status;
    }

    // A phase cannot depend on itself
    phase.dependsOn = phase.dependsOn.filter(id => id.toString() !== phase._id.toString());

    await phase.save();

    const { io } = await import('../server');
    io.emit('project:phases:updated', { projectId: phase.project.toString() });

    res.json({ success: true, data: phase });
  } catch (error: any) {
    logger.error('Update phase error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * PUT /api/phases/:id/milestones
 */
export const updatePhaseMilestones = async (req: Request, res: Response) => {
  try {
    const { milestones } = req.body;
    if (!Array.isArray(milestones)) {
      return res.status(400).json({ success: false, message: 'milestones must be an array' });
    }

    const phase = await ProjectPhase.findById(req.params.id);
    if (!phase) {
      return res.status(404).json({ success: false, message: 'Phase not found' });
    }

    // Milestones removed here may be referenced by issued billings
    const removedIds = phase.milestones
      .map((m: any) => m._id.toString())
      .filter(id => !milestones.some((m: any) => String(m._id) === id));

    if (removedIds.length) {
      const billed = await MilestoneBilling.countDocuments({ milestoneId: { $in: removedIds } });
      if (billed > 0) {
        return res.status(409).json({
          success: false,
          message: `Cannot remove ${billed === 1 ? 'a milestone that has' : 'milestones that have'} billing records attached`
        });
      }
    }

    phase.milestones = milestones;
    await phase.save();

    const { io } = await import('../server');
    io.emit('project:phases:updated', { projectId: phase.project.toString() });

    res.json({ success: true, data: phase });
  } catch (error: any) {
    logger.error('Update phase milestones error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * DELETE /api/phases/:id
 */
export const deletePhase = async (req: Request, res: Response) => {
  try {
    const phase = await ProjectPhase.findById(req.params.id);
    if (!phase) {
      return res.status(404).json({ success: false, message: 'Phase not found' });
    }

    if (phase.status === 'in-review') {
      return res.status(409).json({
        success: false,
        message: 'Phase is under review; cancel the review before deleting'
      });
    }

    const milestoneIds = phase.milestones.map((m: any) => m._id.toString());
    if (milestoneIds.length) {
      const billed = await MilestoneBilling.countDocuments({ milestoneId: { $in: milestoneIds } });
      if (billed > 0) {
        return res.status(409).json({
          success: false,
          message: 'Cannot delete a phase whose milestones have billing records attached'
        });
      }
    }

    await ProjectPhase.updateMany(
      { project: phase.project, dependsOn: phase._id },
      { $pull: { dependsOn: phase._id } }
    );
    await phase.deleteOne();

    const { io } = await import('../server');
    io.emit('project:phases:updated', { projectId: phase.project.toString() });

    res.json({ success: true, message: 'Phase deleted' });
  } catch (error: any) {
    logger.error('Delete phase error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/phases/:id/submit-review
 * Starts the departmental review workflow for the phase.
 */
export const submitPhaseForReview = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { templateId, priority } = req.body;
    if (templateId !== undefined && isInvalidId(templateId)) {
      return res.status(400).json({ success: false, message: 'Invalid templateId' });
    }
    if (priority !== undefined && !['low', 'medium', 'high', 'critical'].includes(priority)) {
      return res.status(400).json({ success: false, message: 'Invalid priority' });
    }

    const { phase, workflowInstance } = await WorkflowProjectIntegration.submitPhaseForReview(
      req.params.id,
      req.user._id.toString(),
      { templateId, priority }
    );

    const { io } = await import('../server');
    io.emit('project:phases:updated', { projectId: phase.project.toString() });

    res.json({ success: true, data: { phase, workflowInstance } });
  } catch (error: any) {
    logger.error('Submit phase for review error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/phases/:id/review
 * Records a reviewer's decision. Authorization (is this user an assignee of the
 * step?) is enforced by the workflow engine, not re-implemented here.
 */
export const reviewPhase = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { decision, comments } = req.body;
    if (!['approve', 'reject', 'request-changes'].includes(decision)) {
      return res.status(400).json({
        success: false,
        message: 'decision must be one of: approve, reject, request-changes'
      });
    }
    if (comments !== undefined && (typeof comments !== 'string' || comments.length > 2000)) {
      return res.status(400).json({ success: false, message: 'comments must be a string of at most 2000 characters' });
    }
    if (decision !== 'approve' && !comments?.trim()) {
      return res.status(400).json({ success: false, message: 'comments are required when rejecting or requesting changes' });
    }

    const phase = await ProjectPhase.findById(req.params.id);
    if (!phase) {
      return res.status(404).json({ success: false, message: 'Phase not found' });
    }
    if (!phase.reviewInstance) {
      return res.status(409).json({ success: false, message: 'Phase has no review in progress' });
    }

    const instance = await WorkflowInstance.findById(phase.reviewInstance);
    if (!instance || instance.status !== 'active') {
      return res.status(409).json({ success: false, message: 'Phase review is not active' });
    }

    const userId = req.user._id.toString();
    const isPrivileged = canManageWorkflows(req.user);

    // Derive the step from the instance rather than trusting the client
    const actionable = instance.steps.filter(
      s => (s.status === 'active' || s.status === 'escalated')
        && (isPrivileged || s.assignedTo?.some(a => a.toString() === userId))
    );

    if (!actionable.length) {
      return res.status(403).json({
        success: false,
        message: 'You are not assigned to review this phase at its current step'
      });
    }

    const requestedStepId = req.body.stepId;
    const step = requestedStepId
      ? actionable.find(s => s.stepId === requestedStepId)
      : actionable[0];

    if (!step) {
      return res.status(403).json({ success: false, message: 'You cannot act on that step' });
    }

    const updated = await WorkflowEngine.processStepAction({
      instanceId: instance._id.toString(),
      stepId: step.stepId,
      action: decision === 'approve' ? 'approve' : 'reject',
      userId,
      isPrivileged,
      comments,
      // Distinguishes a send-back from a terminal rejection when the phase syncs
      resultData: decision === 'request-changes' ? { intent: 'changes-requested' } : undefined
    });

    // The engine syncs the phase asynchronously; read it back for the response
    await WorkflowProjectIntegration.syncPhaseFromInstance(updated);
    const refreshed = await ProjectPhase.findById(phase._id)
      .populate('reviewDepartments', 'name')
      .populate('reviewSummary.decidedBy', 'name email')
      .lean();

    const { io } = await import('../server');
    io.emit('project:phases:updated', { projectId: phase.project.toString() });

    res.json({ success: true, data: { phase: refreshed, workflowInstance: updated } });
  } catch (error: any) {
    logger.error('Review phase error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/phases/:id/withdraw-review
 * Cancels an in-flight review so the phase can be edited and resubmitted.
 */
export const withdrawPhaseReview = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const phase = await ProjectPhase.findById(req.params.id);
    if (!phase) {
      return res.status(404).json({ success: false, message: 'Phase not found' });
    }
    if (!phase.reviewInstance) {
      return res.status(409).json({ success: false, message: 'Phase has no review in progress' });
    }

    await WorkflowEngine.cancelWorkflow(
      phase.reviewInstance.toString(),
      req.user._id.toString(),
      req.body.reason?.trim() || 'Review withdrawn by the project side'
    );

    const refreshed = await ProjectPhase.findById(phase._id).lean();

    const { io } = await import('../server');
    io.emit('project:phases:updated', { projectId: phase.project.toString() });

    res.json({ success: true, data: refreshed });
  } catch (error: any) {
    logger.error('Withdraw phase review error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/phases/pending-review
 * The caller's own review queue. The assignee set is read from the workflow
 * instances, never from a client-supplied user or department.
 */
export const getPendingPhaseReviews = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { page, limit, skip } = parsePagination(req.query);
    const userId = new mongoose.Types.ObjectId(req.user._id.toString());

    const filter = {
      entityType: 'project-phase',
      status: 'active',
      currentAssignees: userId
    };

    const [instances, total] = await Promise.all([
      WorkflowInstance.find(filter)
        .sort({ priority: 1, startedAt: 1 })
        .skip(skip)
        .limit(limit)
        .select('entityId entityTitle projectId phaseId currentStepId currentStepName startedAt dueDate priority slaBreached')
        .lean(),
      WorkflowInstance.countDocuments(filter)
    ]);

    const phases = await ProjectPhase.find({ _id: { $in: instances.map(i => i.entityId) } })
      .select('name order status project budget startDate endDate reviewRound reviewSummary')
      .populate('project', 'name')
      .populate('reviewDepartments', 'name')
      .lean();

    const phaseById = new Map(phases.map(p => [p._id.toString(), p]));

    const data = instances.map(instance => ({
      instanceId: instance._id,
      stepId: instance.currentStepId,
      stepName: instance.currentStepName,
      submittedAt: instance.startedAt,
      dueDate: instance.dueDate,
      priority: instance.priority,
      slaBreached: instance.slaBreached,
      phase: phaseById.get(instance.entityId.toString()) || null
    }));

    res.json({
      success: true,
      data,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (error: any) {
    logger.error('Get pending phase reviews error:', error);
    res.status(500).json({ success: false, message: 'Failed to load pending reviews' });
  }
};

/**
 * GET /api/phases/:id/workflow
 */
export const getPhaseWorkflow = async (req: Request, res: Response) => {
  try {
    const instance = await WorkflowProjectIntegration.getPhaseWorkflow(req.params.id);
    res.json({ success: true, data: instance });
  } catch (error: any) {
    logger.error('Get phase workflow error:', error);
    res.status(500).json({ success: false, message: 'Failed to load phase workflow' });
  }
};
