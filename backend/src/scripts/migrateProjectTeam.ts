/**
 * Migration Script: Project Manager & Members Cleanup
 * 
 * This script:
 * 1. Migrates singular 'manager' field to 'managers' array
 * 2. Removes 'members' field (User refs) - use 'team' instead
 * 3. Ensures all projects have at least one manager
 * 
 * Run: npx ts-node src/scripts/migrateProjectTeam.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/rayerp';

interface IProject {
  _id: mongoose.Types.ObjectId;
  name: string;
  manager?: mongoose.Types.ObjectId;
  managers?: mongoose.Types.ObjectId[];
  members?: mongoose.Types.ObjectId[];
  team?: mongoose.Types.ObjectId[];
}

async function migrateProjects() {
  try {
    console.log('🚀 Starting Project Team Migration...\n');
    
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const projectsCollection = db.collection('projects');

    // Get all projects
    const projects = await projectsCollection.find({}).toArray();
    console.log(`📊 Found ${projects.length} projects to process\n`);

    let migratedManagers = 0;
    let removedMembers = 0;
    let skipped = 0;
    let errors = 0;

    for (const project of projects) {
      try {
        const updates: any = {};
        const unsets: any = {};
        let needsUpdate = false;

        // 1. Migrate manager to managers array
        if (project.manager && (!project.managers || project.managers.length === 0)) {
          updates.managers = [project.manager];
          unsets.manager = '';
          needsUpdate = true;
          migratedManagers++;
          console.log(`  ✓ Migrating manager for: ${project.name}`);
        }

        // 2. Remove members field
        if (project.members && project.members.length > 0) {
          unsets.members = '';
          needsUpdate = true;
          removedMembers++;
          console.log(`  ✓ Removing ${project.members.length} members from: ${project.name}`);
        }

        // Apply updates
        if (needsUpdate) {
          const updateDoc: any = {};
          if (Object.keys(updates).length > 0) updateDoc.$set = updates;
          if (Object.keys(unsets).length > 0) updateDoc.$unset = unsets;

          await projectsCollection.updateOne(
            { _id: project._id },
            updateDoc
          );
        } else {
          skipped++;
        }
      } catch (error) {
        errors++;
        console.error(`  ✗ Error processing ${project.name}:`, error);
      }
    }

    console.log('\n📈 Migration Summary:');
    console.log(`  • Managers migrated: ${migratedManagers}`);
    console.log(`  • Members removed: ${removedMembers}`);
    console.log(`  • Skipped (no changes): ${skipped}`);
    console.log(`  • Errors: ${errors}`);

    // Verify migration
    console.log('\n🔍 Verifying migration...');
    const withOldManager = await projectsCollection.countDocuments({ manager: { $exists: true } });
    const withOldMembers = await projectsCollection.countDocuments({ members: { $exists: true } });
    const withNewManagers = await projectsCollection.countDocuments({ managers: { $exists: true, $ne: [] } });

    console.log(`  • Projects with old 'manager' field: ${withOldManager}`);
    console.log(`  • Projects with old 'members' field: ${withOldMembers}`);
    console.log(`  • Projects with new 'managers' array: ${withNewManagers}`);

    if (withOldManager === 0 && withOldMembers === 0) {
      console.log('\n✅ Migration completed successfully!');
    } else {
      console.log('\n⚠️  Migration incomplete - some old fields remain');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

// Run migration
migrateProjects()
  .then(() => {
    console.log('\n✨ Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Migration script failed:', error);
    process.exit(1);
  });
