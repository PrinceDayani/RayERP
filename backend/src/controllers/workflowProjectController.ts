import { Request, Response } from 'express';
import { WorkflowProjectIntegration } from '../services/workflowProjectIntegration';
import { logger } from '../utils/logger';

/**
 * Get the active workflow for a project
 */
export const getProjectWorkflow = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { projectId } = req.params;
    const workflow = await WorkflowProjectIntegration.getProjectWorkflow(projectId);

    if (!workflow) {
      return res.status(200).json({ success: true, data: null, message: 'No active workflow for this project' });
    }

    res.json({ success: true, data: workflow });
  } catch (error: any) {
    logger.error('Get project workflow error:', error);
    res.status(500).json({ success: false, message: error.message });
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
    const workflows = await WorkflowProjectIntegration.getProjectWorkflowHistory(projectId);

    res.json({ success: true, data: workflows });
  } catch (error: any) {
    logger.error('Get project workflow history error:', error);
    res.status(500).json({ success: false, message: error.message });
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
    const { workflowTemplateId, metadata } = req.body;

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
    const { workflowTemplateId } = req.body;

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
