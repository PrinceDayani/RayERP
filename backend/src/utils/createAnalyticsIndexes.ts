import Employee from '../models/Employee';
import Project from '../models/Project';
import Task from '../models/Task';

export async function createAnalyticsIndexes() {
  try {
    await Promise.all([
      Employee.collection.createIndex({ createdAt: -1 }),
      Employee.collection.createIndex({ department: 1 }),
      Project.collection.createIndex({ createdAt: -1 }),
      Project.collection.createIndex({ status: 1, updatedAt: -1 }),
      Task.collection.createIndex({ createdAt: -1 }),
      Task.collection.createIndex({ status: 1 }),
      Task.collection.createIndex({ assignedTo: 1, status: 1 })
    ]);
    console.log('✅ Analytics indexes created');
  } catch (error) {
    console.error('❌ Error creating analytics indexes:', error);
  }
}
