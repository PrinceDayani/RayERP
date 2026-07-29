import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { WorkflowProjectIntegration } from '../services/workflowProjectIntegration';
import { getAccessibleProjectIdsForUser } from '../middleware/projectAccess.middleware';
import { canManageWorkflows } from '../middleware/rbac.middleware';
import { logger } from '../utils/logger';

const isInvalidId = (id: any) => !id || !mongoose.isValidObjectId(String(id));

const hasProjectAccess = async (user: any, projectId: string): Promise<boolean> => {
  if (canManageWorkflows(user)) return true;
  const access = await getAccessibleProjectIdsForUser(user);
  if (access.all) return true;
  return access.ids.some(id => id.toString() === projectId);
};

/**
 * Get the active workflow for a project
 */
export const getProjectWorkflow = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { projectId } = req.params;
    if (isInvalidId(projectId)) {
      return res.status(400).json({ success: false, message: 'Invalid project id' });
    }
    if (!(await hasProjectAccess(req.user, projectId))) {
      return res.status(403).json({ success: false, message: 'You do not have access to this project' });
    }

    const workflow = await WorkflowProjectIntegration.getProjectWorkflow(projectId);

    if (!workflow) {
      return res.status(200).json({ success: true, data: null, message: 'No active workflow for this project' });
    }

    res.json({ success: true, data: workflow });
  } catch (error: any) {
    logger.error('Get project workflow error:', error);
    res.status(500).json({ success: false, message: 'Failed to load project workflow' });
  }
};

/**
 * Get all workflow history for a project
 */
export const getProjectWorkflowHistory = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { projectId } = req.params;
    if (isInvalidId(projectId)) {
      return res.status(400).json({ success: false, message: 'Invalid project id' });
    }
    if (!(await hasProjectAccess(req.user, projectId))) {
      return res.status(403).json({ success: false, message: 'You do not have access to this project' });
    }

    const workflows = await WorkflowProjectIntegration.getProjectWorkflowHistory(projectId);

    res.json({ success: true, data: workflows });
  } catch (error: any) {
    logger.error('Get project workflow history error:', error);
    res.status(500).json({ success: false, message: 'Failed to load project workflow history' });
  }
};

/**
 * Manually start a workflow for an existing project.
 * Useful when a project was created with skipWorkflow=true and now needs one.
 */
export const startProjectWorkflow = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { projectId } = req.params;
    if (isInvalidId(projectId)) {
      return res.status(400).json({ success: false, message: 'Invalid project id' });
    }
    const { workflowTemplateId, metadata } = req.body;
    if (workflowTemplateId !== undefined && isInvalidId(workflowTemplateId)) {
      return res.status(400).json({ success: false, message: 'Invalid workflowTemplateId' });
    }
    if (!(await hasProjectAccess(req.user, projectId))) {
      return res.status(403).json({ success: false, message: 'You do not have access to this project' });
    }

    const result = await WorkflowProjectIntegration.onProjectCreated(
      projectId,
      req.user.id,
      {
        workflowTemplateId,
        metadata
      }
    );

    if (result.error) {
      return res.status(400).json({ success: false, message: result.error });
    }

    res.status(201).json({ success: true, data: result.workflowInstance });
  } catch (error: any) {
    logger.error('Start project workflow error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * Restart a workflow for a project (cancel existing and start fresh).
 * Useful after a rejection when the user wants to retry.
 */
export const restartProjectWorkflow = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { projectId } = req.params;
    if (isInvalidId(projectId)) {
      return res.status(400).json({ success: false, message: 'Invalid project id' });
    }
    const { workflowTemplateId } = req.body;
    if (workflowTemplateId !== undefined && isInvalidId(workflowTemplateId)) {
      return res.status(400).json({ success: false, message: 'Invalid workflowTemplateId' });
    }
    if (!(await hasProjectAccess(req.user, projectId))) {
      return res.status(403).json({ success: false, message: 'You do not have access to this project' });
    }

    const result = await WorkflowProjectIntegration.restartProjectWorkflow(
      projectId,
      req.user.id,
      workflowTemplateId
    );

    if (result.error) {
      return res.status(400).json({ success: false, message: result.error });
    }

    res.status(201).json({ success: true, data: result.workflowInstance });
  } catch (error: any) {
    logger.error('Restart project workflow error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};
