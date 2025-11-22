import Employee from '../models/Employee';
import Project from '../models/Project';
import Task from '../models/Task';

export const createDashboardIndexes = async () => {
  try {
    await Promise.all([
      Employee.collection.createIndex({ status: 1 }),
      Project.collection.createIndex({ status: 1 }),
      Project.collection.createIndex({ updatedAt: -1 }),
      Task.collection.createIndex({ status: 1 })
    ]);
    console.log('✅ Dashboard indexes created successfully');
  } catch (error) {
    console.error('❌ Error creating dashboard indexes:', error);
  }
};
