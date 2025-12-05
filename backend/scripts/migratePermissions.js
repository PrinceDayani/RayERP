/**
 * Permission Migration Script
 * Migrates old permission format to new standardized format
 * Run: node scripts/migratePermissions.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Old format -> New format mapping
const PERMISSION_MIGRATION_MAP = {
  // Old colon format
  'view:dashboard': 'dashboard.view',
  'view:analytics': 'analytics.view',
  'manage:users': 'users.manage',
  'manage:roles': 'roles.manage',
  'manage:system': 'system.manage',
  'view:admin_panel': 'admin.view',
  'view:employees': 'employees.view',
  'create:employee': 'employees.create',
  'edit:employee': 'employees.edit',
  'delete:employee': 'employees.delete',
  'view:projects': 'projects.view',
  'create:project': 'projects.create',
  'edit:project': 'projects.edit',
  'delete:project': 'projects.delete',
  'view:tasks': 'tasks.view',
  'create:task': 'tasks.create',
  'edit:task': 'tasks.edit',
  'delete:task': 'tasks.delete',
  'view:finance': 'finance.view',
  'manage:finance': 'finance.manage',
  
  // Old underscore format
  'view_employees': 'employees.view',
  'create_employee': 'employees.create',
  'update_employee': 'employees.edit',
  'delete_employee': 'employees.delete',
  'view_attendance': 'attendance.view',
  'manage_attendance': 'attendance.manage',
  'view_leaves': 'leaves.view',
  'create_leave': 'leaves.create',
  'manage_leaves': 'leaves.manage',
  'view_projects': 'projects.view',
  'create_project': 'projects.create',
  'update_project': 'projects.edit',
  'delete_project': 'projects.delete',
  'view_tasks': 'tasks.view',
  'create_task': 'tasks.create',
  'update_task': 'tasks.edit',
  'delete_task': 'tasks.delete',
  
  // Admin permissions
  'admin.access': 'admin.view',
  'users.view': 'users.view', // Already correct
  'analytics.view': 'analytics.view', // Already correct
};

async function migratePermissions() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/rayerp');
    console.log('✅ Connected to MongoDB\n');

    const RoleSchema = new mongoose.Schema({
      name: String,
      permissions: [String],
      level: Number
    });

    const DepartmentSchema = new mongoose.Schema({
      name: String,
      permissions: [String]
    });

    const Role = mongoose.models.Role || mongoose.model('Role', RoleSchema);
    const Department = mongoose.models.Department || mongoose.model('Department', DepartmentSchema);

    let rolesUpdated = 0;
    let departmentsUpdated = 0;
    let permissionsMigrated = 0;

    // Migrate Role Permissions
    console.log('🔄 Migrating Role Permissions...\n');
    const roles = await Role.find();

    for (const role of roles) {
      if (!role.permissions || role.permissions.length === 0) {
        console.log(`  ⏭️  Skipping ${role.name} (no permissions)`);
        continue;
      }

      // Skip Root role (has *)
      if (role.permissions.includes('*')) {
        console.log(`  ⏭️  Skipping ${role.name} (has wildcard)`);
        continue;
      }

      const oldPermissions = [...role.permissions];
      const newPermissions = new Set();
      let changed = false;

      for (const perm of oldPermissions) {
        if (PERMISSION_MIGRATION_MAP[perm]) {
          newPermissions.add(PERMISSION_MIGRATION_MAP[perm]);
          changed = true;
          permissionsMigrated++;
          console.log(`    ${perm} → ${PERMISSION_MIGRATION_MAP[perm]}`);
        } else if (perm.includes('.')) {
          // Already in new format
          newPermissions.add(perm);
        } else {
          // Unknown format, keep as is
          newPermissions.add(perm);
          console.log(`    ⚠️  Unknown format: ${perm} (kept as is)`);
        }
      }

      if (changed) {
        role.permissions = Array.from(newPermissions);
        await role.save();
        rolesUpdated++;
        console.log(`  ✓ Updated ${role.name}\n`);
      } else {
        console.log(`  - ${role.name} (no changes needed)\n`);
      }
    }

    // Migrate Department Permissions
    console.log('\n🔄 Migrating Department Permissions...\n');
    const departments = await Department.find();

    for (const dept of departments) {
      if (!dept.permissions || dept.permissions.length === 0) {
        console.log(`  ⏭️  Skipping ${dept.name} (no permissions)`);
        continue;
      }

      const oldPermissions = [...dept.permissions];
      const newPermissions = new Set();
      let changed = false;

      for (const perm of oldPermissions) {
        if (PERMISSION_MIGRATION_MAP[perm]) {
          newPermissions.add(PERMISSION_MIGRATION_MAP[perm]);
          changed = true;
          console.log(`    ${perm} → ${PERMISSION_MIGRATION_MAP[perm]}`);
        } else if (perm.includes('.')) {
          newPermissions.add(perm);
        } else {
          newPermissions.add(perm);
          console.log(`    ⚠️  Unknown format: ${perm} (kept as is)`);
        }
      }

      if (changed) {
        dept.permissions = Array.from(newPermissions);
        await dept.save();
        departmentsUpdated++;
        console.log(`  ✓ Updated ${dept.name}\n`);
      } else {
        console.log(`  - ${dept.name} (no changes needed)\n`);
      }
    }

    // Summary
    console.log('\n📊 Migration Summary:');
    console.log(`   Roles Updated: ${rolesUpdated}/${roles.length}`);
    console.log(`   Departments Updated: ${departmentsUpdated}/${departments.length}`);
    console.log(`   Permissions Migrated: ${permissionsMigrated}`);
    console.log('\n✅ Migration completed successfully!');
    console.log('\n📋 Next Steps:');
    console.log('   1. Run: node scripts/seedPermissions.js');
    console.log('   2. Restart backend server');
    console.log('   3. Test permission checks\n');

  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
}

migratePermissions();
