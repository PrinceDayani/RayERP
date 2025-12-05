const mongoose = require('mongoose');
require('dotenv').config();

const PERMISSIONS = [
  // Dashboard & Analytics
  { name: 'dashboard.view', description: 'View dashboard', category: 'Dashboard' },
  { name: 'analytics.view', description: 'View analytics and reports', category: 'Analytics' },
  
  // User Management
  { name: 'users.view', description: 'View users', category: 'Users' },
  { name: 'users.create', description: 'Create new users', category: 'Users' },
  { name: 'users.edit', description: 'Edit user information', category: 'Users' },
  { name: 'users.delete', description: 'Delete users', category: 'Users' },
  
  // Role Management
  { name: 'roles.view', description: 'View roles', category: 'Roles' },
  { name: 'roles.create', description: 'Create new roles', category: 'Roles' },
  { name: 'roles.edit', description: 'Edit role information and permissions', category: 'Roles' },
  { name: 'roles.delete', description: 'Delete roles', category: 'Roles' },
  
  // Employee Management
  { name: 'employees.view', description: 'View employees', category: 'Employees' },
  { name: 'employees.create', description: 'Create employees', category: 'Employees' },
  { name: 'employees.edit', description: 'Edit employees', category: 'Employees' },
  { name: 'employees.delete', description: 'Delete employees', category: 'Employees' },
  
  // Attendance Management
  { name: 'attendance.view', description: 'View attendance records', category: 'Attendance' },
  { name: 'attendance.manage', description: 'Manage attendance', category: 'Attendance' },
  
  // Leave Management
  { name: 'leaves.view', description: 'View leave requests', category: 'Leaves' },
  { name: 'leaves.create', description: 'Create leave requests', category: 'Leaves' },
  { name: 'leaves.manage', description: 'Approve/reject leave requests', category: 'Leaves' },
  
  // Project Management
  { name: 'projects.view', description: 'View projects', category: 'Projects' },
  { name: 'projects.create', description: 'Create projects', category: 'Projects' },
  { name: 'projects.edit', description: 'Edit projects', category: 'Projects' },
  { name: 'projects.delete', description: 'Delete projects', category: 'Projects' },
  
  // Task Management
  { name: 'tasks.view', description: 'View tasks', category: 'Tasks' },
  { name: 'tasks.create', description: 'Create tasks', category: 'Tasks' },
  { name: 'tasks.edit', description: 'Edit tasks', category: 'Tasks' },
  { name: 'tasks.delete', description: 'Delete tasks', category: 'Tasks' },
  
  // Finance Module
  { name: 'finance.view', description: 'View finance module', category: 'Finance' },
  { name: 'finance.manage', description: 'Manage finance module', category: 'Finance' },
  
  // Budget & Planning
  { name: 'budgets.view', description: 'View budgets', category: 'Budget & Planning' },
  { name: 'budgets.create', description: 'Create budgets', category: 'Budget & Planning' },
  { name: 'budgets.edit', description: 'Edit budgets', category: 'Budget & Planning' },
  { name: 'budgets.delete', description: 'Delete budgets', category: 'Budget & Planning' },
  { name: 'budgets.approve', description: 'Approve budgets', category: 'Budget & Planning' },
  { name: 'budgets.allocate', description: 'Allocate budgets', category: 'Budget & Planning' },
  { name: 'budgets.track', description: 'Track budget utilization', category: 'Budget & Planning' },
  
  // System Administration
  { name: 'permissions.manage', description: 'Manage permissions', category: 'System Administration' },
  { name: 'settings.view', description: 'View system settings', category: 'System Administration' },
  { name: 'settings.edit', description: 'Edit system settings', category: 'System Administration' },
];

async function seedPermissions() {
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

    console.log('📝 Seeding Permissions...');
    let createdCount = 0;
    let existingCount = 0;

    for (const perm of PERMISSIONS) {
      const existing = await Permission.findOne({ name: perm.name });
      if (!existing) {
        await Permission.create(perm);
        console.log(`  ✓ Created: ${perm.name}`);
        createdCount++;
      } else {
        existingCount++;
      }
    }

    console.log(`\n📊 Permissions Summary:`);
    console.log(`   Created: ${createdCount}`);
    console.log(`   Already Exists: ${existingCount}`);
    console.log(`   Total: ${PERMISSIONS.length}\n`);

    console.log('🔐 Updating Root Role...');
    const rootRole = await Role.findOne({ name: 'Root' });
    if (rootRole) {
      rootRole.permissions = ['*'];
      await rootRole.save();
      console.log(`  ✓ Updated Root with all permissions (*)`);
    }

    console.log('\n✅ Permission seeding completed!\n');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

seedPermissions();
