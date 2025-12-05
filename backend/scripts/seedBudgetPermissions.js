/**
 * Budget & Planning Permissions Seeding Script
 * Run: node scripts/seedBudgetPermissions.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const BUDGET_PERMISSIONS = [
  { name: 'budgets.view', description: 'View budgets', category: 'Budget & Planning' },
  { name: 'budgets.create', description: 'Create budgets', category: 'Budget & Planning' },
  { name: 'budgets.edit', description: 'Edit budgets', category: 'Budget & Planning' },
  { name: 'budgets.delete', description: 'Delete budgets', category: 'Budget & Planning' },
  { name: 'budgets.approve', description: 'Approve budgets', category: 'Budget & Planning' },
  { name: 'budgets.allocate', description: 'Allocate budget amounts', category: 'Budget & Planning' },
  { name: 'budgets.track', description: 'Track budget utilization', category: 'Budget & Planning' },
];

async function seedBudgetPermissions() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/rayerp');
    console.log('✅ Connected to MongoDB\n');

    const PermissionSchema = new mongoose.Schema({
      name: { type: String, required: true, unique: true },
      description: String,
      category: String,
      isActive: { type: Boolean, default: true }
    }, { timestamps: true });

    const RoleSchema = new mongoose.Schema({
      name: String,
      permissions: [String],
      level: Number,
      isActive: Boolean
    });

    const Permission = mongoose.models.Permission || mongoose.model('Permission', PermissionSchema);
    const Role = mongoose.models.Role || mongoose.model('Role', RoleSchema);

    console.log('📝 Seeding Budget Permissions...');
    let createdCount = 0;
    let existingCount = 0;

    for (const perm of BUDGET_PERMISSIONS) {
      const existing = await Permission.findOne({ name: perm.name });
      if (!existing) {
        await Permission.create(perm);
        console.log(`  ✓ Created: ${perm.name}`);
        createdCount++;
      } else {
        existingCount++;
      }
    }

    console.log(`\n📊 Budget Permissions Summary:`);
    console.log(`   Created: ${createdCount}`);
    console.log(`   Already Exists: ${existingCount}`);
    console.log(`   Total: ${BUDGET_PERMISSIONS.length}\n`);

    console.log('🔐 Updating Role Permissions...');
    
    // Root - all permissions
    const rootRole = await Role.findOne({ name: 'Root' });
    if (rootRole && !rootRole.permissions.includes('*')) {
      rootRole.permissions.push('*');
      await rootRole.save();
      console.log('  ✓ Updated Root role');
    }

    // Admin - all budget permissions
    const adminRole = await Role.findOne({ name: 'Admin' });
    if (adminRole) {
      const budgetPerms = BUDGET_PERMISSIONS.map(p => p.name);
      const newPerms = budgetPerms.filter(p => !adminRole.permissions.includes(p));
      if (newPerms.length > 0) {
        adminRole.permissions.push(...newPerms);
        await adminRole.save();
        console.log(`  ✓ Updated Admin role with ${newPerms.length} permissions`);
      }
    }

    // Manager - view, create, edit, track
    const managerRole = await Role.findOne({ name: 'Manager' });
    if (managerRole) {
      const managerPerms = ['budgets.view', 'budgets.create', 'budgets.edit', 'budgets.track'];
      const newPerms = managerPerms.filter(p => !managerRole.permissions.includes(p));
      if (newPerms.length > 0) {
        managerRole.permissions.push(...newPerms);
        await managerRole.save();
        console.log(`  ✓ Updated Manager role with ${newPerms.length} permissions`);
      }
    }

    // Employee - view only
    const employeeRole = await Role.findOne({ name: 'Employee' });
    if (employeeRole) {
      if (!employeeRole.permissions.includes('budgets.view')) {
        employeeRole.permissions.push('budgets.view');
        await employeeRole.save();
        console.log('  ✓ Updated Employee role with view permission');
      }
    }

    console.log('\n✅ Budget permissions seeding completed successfully!');
    console.log('\n📋 Next Steps:');
    console.log('   1. Restart your backend server');
    console.log('   2. Test budget permissions in the frontend');
    console.log('   3. Verify role-based access control\n');

  } catch (error) {
    console.error('❌ Error seeding budget permissions:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
}

seedBudgetPermissions();
