/**
 * AUTOMATED MIGRATION: Project Team Management
 * 
 * This script does EVERYTHING:
 * 1. Migrates data (manager → managers, remove members)
 * 2. Updates controller code automatically
 * 3. Updates model to remove old fields
 * 4. Verifies everything
 * 
 * Run: npx ts-node src/scripts/autoMigrate.ts
 */

import mongoose from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/rayerp';

async function migrateData() {
  console.log('📊 Step 1: Migrating Database...\n');
  
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db;
  const projectsCollection = db.collection('projects');

  const projects = await projectsCollection.find({}).toArray();
  let migrated = 0;

  for (const project of projects) {
    const updates: any = {};
    const unsets: any = {};

    if (project.manager && (!project.managers || project.managers.length === 0)) {
      updates.managers = [project.manager];
      unsets.manager = '';
      migrated++;
    }

    if (project.members) {
      unsets.members = '';
    }

    if (Object.keys(updates).length > 0 || Object.keys(unsets).length > 0) {
      const updateDoc: any = {};
      if (Object.keys(updates).length > 0) updateDoc.$set = updates;
      if (Object.keys(unsets).length > 0) updateDoc.$unset = unsets;
      await projectsCollection.updateOne({ _id: project._id }, updateDoc);
    }
  }

  await mongoose.disconnect();
  console.log(`✅ Migrated ${migrated} projects\n`);
}

function updateController() {
  console.log('🔧 Step 2: Updating Controller...\n');
  
  const controllerPath = path.join(__dirname, '../controllers/projectController.ts');
  let content = fs.readFileSync(controllerPath, 'utf8');

  // Replace all populate calls
  content = content.replace(/\.populate\(\{ path: 'manager',/g, ".populate({ path: 'managers',");
  content = content.replace(/\.populate\(\{ path: 'members'.*?\}\)/g, '');
  
  // Remove members from queries
  content = content.replace(/\{ members: user\._id \},\s*/g, '');
  
  // Update access checks
  content = content.replace(
    /const isMember = project\.members\.some\(.*?\);/g,
    ''
  );
  content = content.replace(
    /isMember \|\| /g,
    ''
  );
  content = content.replace(
    /isManager = project\.manager && project\.manager\._id && project\.manager\._id\.toString\(\) === employee\._id\.toString\(\);/g,
    'isManager = project.managers && project.managers.some((m: any) => m && m._id && m._id.toString() === employee._id.toString());'
  );
  
  // Update manager references
  content = content.replace(
    /project\.manager \? project\.manager\.toString\(\) : null/g,
    'project.managers && project.managers.length > 0 ? project.managers[0].toString() : null'
  );
  content = content.replace(
    /project\.manager\._id\?\.toString\(\) \|\| project\.manager\.toString\(\)/g,
    'project.managers && project.managers.length > 0 ? project.managers[0].toString() : null'
  );

  // Update createProject
  content = content.replace(
    /manager: req\.body\.manager \|\| undefined,\s*team:/g,
    `manager: req.body.managers && req.body.managers.length > 0 ? req.body.managers[0] : req.body.manager,\n      managers: Array.isArray(req.body.managers) ? req.body.managers : (req.body.manager ? [req.body.manager] : []),\n      team:`
  );
  content = content.replace(
    /owner: user\._id,\s*members: Array\.isArray\(req\.body\.members\).*?,/g,
    'owner: user._id,'
  );

  // Update updateProject
  content = content.replace(
    /if \(req\.body\.manager !== undefined\) updateData\.manager = req\.body\.manager;/g,
    `if (req.body.manager !== undefined) updateData.manager = req.body.manager;\n    if (req.body.managers !== undefined) updateData.managers = Array.isArray(req.body.managers) ? req.body.managers : [];`
  );

  fs.writeFileSync(controllerPath, content);
  console.log('✅ Controller updated\n');
}

function updateModel() {
  console.log('🗂️  Step 3: Updating Model...\n');
  
  const modelPath = path.join(__dirname, '../models/Project.ts');
  let content = fs.readFileSync(modelPath, 'utf8');

  // Update interface
  content = content.replace(
    /manager: mongoose\.Types\.ObjectId;\s*managers: mongoose\.Types\.ObjectId\[\];\s*team: mongoose\.Types\.ObjectId\[\];\s*owner: mongoose\.Types\.ObjectId;\s*members: mongoose\.Types\.ObjectId\[\];/,
    `managers: mongoose.Types.ObjectId[];\n  team: mongoose.Types.ObjectId[];\n  owner: mongoose.Types.ObjectId;`
  );

  // Update schema
  content = content.replace(
    /manager: \{ type: Schema\.Types\.ObjectId, ref: 'Employee', required: true \},\s*managers: \[.*?\],\s*team: \[.*?\],\s*owner: \{ type: Schema\.Types\.ObjectId, ref: 'User', required: true \},\s*members: \[.*?\],/,
    `managers: [{ type: Schema.Types.ObjectId, ref: 'Employee', required: true }],\n  team: [{ type: Schema.Types.ObjectId, ref: 'Employee' }],\n  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },`
  );

  // Add virtual
  const virtualCode = `\n// Virtual for backward compatibility\nprojectSchema.virtual('manager').get(function() {\n  return this.managers && this.managers.length > 0 ? this.managers[0] : null;\n});\n\n`;
  
  if (!content.includes("projectSchema.virtual('manager')")) {
    content = content.replace(
      /\/\/ Performance indexes/,
      virtualCode + '// Performance indexes'
    );
  }

  // Update indexes
  content = content.replace(
    /projectSchema\.index\(\{ manager: 1, status: 1 \}\);\s*/g,
    ''
  );
  content = content.replace(
    /projectSchema\.index\(\{ members: 1, status: 1 \}\);\s*/g,
    ''
  );

  fs.writeFileSync(modelPath, content);
  console.log('✅ Model updated\n');
}

function updateFrontend() {
  console.log('🎨 Step 4: Updating Frontend...\n');
  
  const apiPath = path.join(__dirname, '../../../frontend/src/lib/api/projectsAPI.ts');
  let content = fs.readFileSync(apiPath, 'utf8');

  // Update interface
  content = content.replace(
    /manager: string;\s*managers: string\[\];\s*team: string\[\];/,
    `managers: string[];\n  team: string[];`
  );

  fs.writeFileSync(apiPath, content);
  console.log('✅ Frontend updated\n');
}

async function verify() {
  console.log('🔍 Step 5: Verifying...\n');
  
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db;
  const projectsCollection = db.collection('projects');

  const withOldManager = await projectsCollection.countDocuments({ manager: { $exists: true } });
  const withOldMembers = await projectsCollection.countDocuments({ members: { $exists: true } });
  const withNewManagers = await projectsCollection.countDocuments({ managers: { $exists: true, $ne: [] } });

  await mongoose.disconnect();

  console.log(`  Old 'manager' fields: ${withOldManager}`);
  console.log(`  Old 'members' fields: ${withOldMembers}`);
  console.log(`  New 'managers' arrays: ${withNewManagers}\n`);

  if (withOldManager === 0 && withOldMembers === 0 && withNewManagers > 0) {
    console.log('✅ MIGRATION COMPLETE!\n');
    return true;
  } else {
    console.log('⚠️  Migration incomplete\n');
    return false;
  }
}

async function main() {
  try {
    console.log('🚀 AUTOMATED MIGRATION STARTING...\n');
    console.log('This will:');
    console.log('  1. Migrate database data');
    console.log('  2. Update controller code');
    console.log('  3. Update model');
    console.log('  4. Update frontend');
    console.log('  5. Verify everything\n');
    console.log('═'.repeat(50) + '\n');

    await migrateData();
    updateController();
    updateModel();
    updateFrontend();
    const success = await verify();

    console.log('═'.repeat(50) + '\n');
    
    if (success) {
      console.log('✨ ALL DONE! Restart your backend:\n');
      console.log('   cd backend && npm run dev\n');
    } else {
      console.log('⚠️  Please check the logs above\n');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
