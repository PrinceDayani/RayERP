import Employee from '../models/Employee';
import Project from '../models/Project';
import Task from '../models/Task';
import { logger } from './logger';

export const createDashboardIndexes = async () => {
  try {
    await Promise.all([
      Employee.collection.createIndex({ status: 1 }),
      Project.collection.createIndex({ status: 1 }),
      Project.collection.createIndex({ updatedAt: -1 }),
      Task.collection.createIndex({ status: 1 })
    ]);
  } catch (error: any) {
    logger.error('Error creating dashboard indexes', { message: error?.message });
  }
};
