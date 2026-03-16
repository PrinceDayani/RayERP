// Migration script to add taskType and assignmentType to existing tasks
import mongoose from 'mongoose';
import Task from '../models/Task';
import dotenv from 'dotenv';

dotenv.config();

const migrateTaskTypes = async () => {
  try {
    console.log('🔄 Starting task type migration...');
    
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/rayerp');
    console.log('✅ Connected to database');

    // Update all existing tasks
    const result = await Task.updateMany(
      {
        $or: [
          { taskType: { $exists: false } },
          { assignmentType: { $exists: false } }
        ]
      },
      [
        {
          $set: {
            taskType: {
              $cond: {
                if: { $ifNull: ['$project', false] },
                then: 'project',
                else: 'individual'
              }
            },
            assignmentType: {
              $cond: {
                if: { $eq: ['$assignedTo', '$assignedBy'] },
                then: 'self-assigned',
                else: 'assigned'
              }
            }
          }
        }
      ]
    );

    console.log(`✅ Migration completed: ${result.modifiedCount} tasks updated`);
    
    // Verify migration
    const projectTasks = await Task.countDocuments({ taskType: 'project' });
    const individualTasks = await Task.countDocuments({ taskType: 'individual' });
    const assignedTasks = await Task.countDocuments({ assignmentType: 'assigned' });
    const selfAssignedTasks = await Task.countDocuments({ assignmentType: 'self-assigned' });
    
    console.log('\n📊 Migration Summary:');
    console.log(`   Project Tasks: ${projectTasks}`);
    console.log(`   Individual Tasks: ${individualTasks}`);
    console.log(`   Assigned Tasks: ${assignedTasks}`);
    console.log(`   Self-Assigned Tasks: ${selfAssignedTasks}`);
    
    await mongoose.disconnect();
    console.log('\n✅ Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

migrateTaskTypes();
