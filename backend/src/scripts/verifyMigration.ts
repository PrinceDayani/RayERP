/**
 * Verification Script: Check Migration Status
 * 
 * Run: npx ts-node src/scripts/verifyMigration.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/rayerp';

async function verifyMigration() {
  try {
    console.log('🔍 Checking Migration Status...\n');
    
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const projectsCollection = db.collection('projects');

    const total = await projectsCollection.countDocuments();
    const withManager = await projectsCollection.countDocuments({ manager: { $exists: true } });
    const withManagers = await projectsCollection.countDocuments({ managers: { $exists: true, $ne: [] } });
    const withMembers = await projectsCollection.countDocuments({ members: { $exists: true, $ne: [] } });
    const withTeam = await projectsCollection.countDocuments({ team: { $exists: true, $ne: [] } });

    console.log('📊 Current State:');
    console.log(`  Total Projects: ${total}`);
    console.log(`  With 'manager' (old): ${withManager}`);
    console.log(`  With 'managers' (new): ${withManagers}`);
    console.log(`  With 'members' (old): ${withMembers}`);
    console.log(`  With 'team' (keep): ${withTeam}\n`);

    // Check if migration is needed
    if (withManager > 0 && withManagers === 0) {
      console.log('⚠️  Migration NOT started');
      console.log('   Action: Run migration script\n');
    } else if (withManager > 0 && withManagers > 0) {
      console.log('🔄 Migration IN PROGRESS');
      console.log('   Some projects migrated, some not\n');
    } else if (withManager === 0 && withManagers > 0) {
      console.log('✅ Migration COMPLETE');
      console.log('   All projects using new structure\n');
    }

    // Check for data issues
    const issues = [];
    
    if (withManagers === 0 && total > 0) {
      issues.push('⚠️  No projects have managers array');
    }
    
    if (withMembers > 0) {
      issues.push(`⚠️  ${withMembers} projects still have members field`);
    }

    if (issues.length > 0) {
      console.log('🚨 Issues Found:');
      issues.forEach(issue => console.log(`  ${issue}`));
      console.log();
    }

    // Sample project
    const sample = await projectsCollection.findOne({});
    if (sample) {
      console.log('📝 Sample Project Structure:');
      console.log(`  Name: ${sample.name}`);
      console.log(`  Has manager: ${!!sample.manager}`);
      console.log(`  Has managers: ${!!sample.managers}`);
      console.log(`  Managers count: ${sample.managers?.length || 0}`);
      console.log(`  Has members: ${!!sample.members}`);
      console.log(`  Members count: ${sample.members?.length || 0}`);
      console.log(`  Has team: ${!!sample.team}`);
      console.log(`  Team count: ${sample.team?.length || 0}\n`);
    }

  } catch (error) {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

verifyMigration()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
