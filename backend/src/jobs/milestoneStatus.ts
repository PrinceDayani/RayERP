import cron from 'node-cron';
import Project from '../models/Project';
import { logger } from '../utils/logger';

// The 'delayed' milestone status existed in the schema but nothing ever set
// it, so an overdue milestone stayed 'pending' indefinitely. This marks
// milestones whose dueDate has passed while still open.
//
// Idempotent: the filter only matches milestones not already delayed or
// completed, so re-running within the same minute is a no-op.
export const markOverdueMilestones = async (): Promise<number> => {
  const now = new Date();

  const result = await Project.updateMany(
    {
      status: { $nin: ['completed', 'cancelled', 'archived'] },
      milestones: {
        $elemMatch: {
          dueDate: { $lt: now },
          status: { $in: ['pending', 'in-progress'] }
        }
      }
    },
    { $set: { 'milestones.$[overdue].status': 'delayed' } },
    {
      arrayFilters: [
        {
          'overdue.dueDate': { $lt: now },
          'overdue.status': { $in: ['pending', 'in-progress'] }
        }
      ]
    }
  );

  return result.modifiedCount;
};

export const startMilestoneStatusJob = () => {
  // Hourly, so a milestone is flagged within an hour of falling due.
  cron.schedule('0 * * * *', async () => {
    const startedAt = Date.now();
    try {
      const updated = await markOverdueMilestones();
      logger.info('Milestone status sweep completed', {
        projectsUpdated: updated,
        durationMs: Date.now() - startedAt
      });
    } catch (error: any) {
      logger.error('Milestone status sweep failed', {
        message: error?.message,
        durationMs: Date.now() - startedAt
      });
    }
  });

  logger.info('Milestone status job started (hourly)');
};
