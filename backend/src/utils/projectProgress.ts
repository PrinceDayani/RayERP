//path: backend/src/utils/projectProgress.ts

import Project from '../models/Project';
import Task from '../models/Task';
import { logger } from './logger';

type TaskCreditInput = {
  status: string;
  estimatedHours?: number;
  actualHours?: number;
};

// Credit earned by a task toward its project's progress, 0..1.
// In-progress tasks earn partial credit from logged effort, capped below 1 so a
// project only reaches 100% when its work is actually finished.
const IN_PROGRESS_CAP = 0.9;
const IN_PROGRESS_DEFAULT = 0.5;
const REVIEW_CREDIT = 0.9;

export const calculateTaskCredit = (task: TaskCreditInput): number => {
  switch (task.status) {
    case 'completed':
      return 1;
    case 'review':
      return REVIEW_CREDIT;
    case 'in-progress': {
      const estimated = task.estimatedHours || 0;
      const actual = task.actualHours || 0;
      if (estimated > 0 && actual > 0) {
        return Math.min(IN_PROGRESS_CAP, actual / estimated);
      }
      return IN_PROGRESS_DEFAULT;
    }
    default:
      return 0;
  }
};

export interface ProjectProgressResult {
  progress: number;
  totalTasks: number;
  completedTasks: number;
  weighted: boolean;
}

// Weights each task by estimatedHours so a 200-hour task outweighs a 1-hour one.
// Falls back to equal weighting when no task in the project carries an estimate.
export const computeProjectProgress = async (
  projectId: string
): Promise<ProjectProgressResult> => {
  const tasks = await Task.find({ project: projectId, isTemplate: { $ne: true } })
    .select('status estimatedHours actualHours')
    .lean();

  if (tasks.length === 0) {
    return { progress: 0, totalTasks: 0, completedTasks: 0, weighted: false };
  }

  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const totalEstimated = tasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
  const weighted = totalEstimated > 0;

  const earned = tasks.reduce((sum, t) => {
    const weight = weighted ? (t.estimatedHours || 0) : 1;
    return sum + weight * calculateTaskCredit(t);
  }, 0);

  const denominator = weighted ? totalEstimated : tasks.length;
  const progress = Math.min(100, Math.max(0, Math.round((earned / denominator) * 100)));

  return { progress, totalTasks: tasks.length, completedTasks, weighted };
};

// Recalculates and persists progress for a project. Respects the
// autoCalculateProgress flag and skips financially-tracked projects, whose
// progress is driven by payments rather than tasks.
// Returns the stored progress, or null when the project opted out.
export const recalculateProjectProgress = async (
  projectRef: any
): Promise<number | null> => {
  // Accepts a raw id, an ObjectId, or an already-populated project document.
  const projectId = projectRef?._id?.toString() || projectRef?.toString();
  if (!projectId) return null;

  try {
    const project = await Project.findById(projectId).select(
      'autoCalculateProgress progressMode progress'
    );
    if (!project) return null;
    if (!project.autoCalculateProgress) return null;
    if (project.progressMode === 'financial') return null;

    const { progress } = await computeProjectProgress(projectId.toString());

    if (project.progress !== progress) {
      await Project.updateOne({ _id: projectId }, { $set: { progress } });

      const { io } = await import('../server');
      io.emit('project:progress:updated', { projectId: projectId.toString(), progress });
    }

    return progress;
  } catch (error: any) {
    logger.error('Error recalculating project progress', {
      projectId: projectId?.toString(),
      message: error?.message
    });
    return null;
  }
};
