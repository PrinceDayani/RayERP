// Migration script: Convert singular manager to managers array
// Run this once to migrate existing data

import mongoose from 'mongoose';
import Project from '../models/Project';

export const migrateProjectManagers = async () => {
  try {
    console.log('Starting project manager migration...');
    
    const projects = await Project.find({});
    let migrated = 0;
    
    for (const project of projects) {
      const doc = project as any;
      
      // If has old manager field but no managers array
      if (doc.manager && (!doc.managers || doc.managers.length === 0)) {
        doc.managers = [doc.manager];
        await doc.save();
        migrated++;
      }
      
      // If has members field, migrate to team
      if (doc.members && doc.members.length > 0) {
        // Note: members are User refs, team are Employee refs
        // Manual mapping may be needed
        console.log(`Project ${project.name} has ${doc.members.length} members to migrate`);
      }
    }
    
    console.log(`Migration complete. Migrated ${migrated} projects.`);
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
};
