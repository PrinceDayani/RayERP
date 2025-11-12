/**
 * Seed Department Permissions
 * 
 * This script adds default permissions to existing departments
 * Run: node scripts/seedDepartmentPermissions.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const departmentPermissionsMap = {
  'Finance': [
    'finance.view',
    'finance.manage',
    'budgets.view',
    'budgets.create',
    'budgets.update',
    'expenses.view',
    'expenses.create',
    'expenses.approve',
    'invoices.view',
    'invoices.create',
    'payments.view',
    'payments.process',
    'reports.view',
    'reports.export',
    'analytics.view'
  ],
  'Human Resources': [
    'employees.view',
    'employees.create',
    'employees.update',
    'attendance.view',
    'attendance.manage',
    'leave.view',
    'leave.approve',
    'departments.view',
    'reports.view',
    'reports.export'
  ],
  'IT': [
    'projects.view',
    'projects.create',
    'projects.update',
    'tasks.view',
    'tasks.create',
    'tasks.update',
    'tasks.delete',
    'resources.view',
    'resources.allocate',
    'settings.view',
    'settings.manage',
    'users.view'
  ],
  'Sales': [
    'contacts.view',
    'contacts.create',
    'contacts.update',
    'projects.view',
    'tasks.view',
    'reports.view',
    'analytics.view'
  ],
  'Marketing': [
    'contacts.view',
    'contacts.create',
    'projects.view',
    'tasks.view',
    'tasks.create',
    'reports.view',
    'analytics.view'
  ],
  'Operations': [
    'projects.view',
    'projects.create',
    'projects.update',
    'tasks.view',
    'tasks.create',
    'tasks.update',
    'resources.view',
    'resources.allocate',
    'inventory.view',
    'inventory.manage',
    'reports.view'
  ],
  'Engineering': [
    'projects.view',
    'projects.create',
    'projects.update',
    'tasks.view',
    'tasks.create',
    'tasks.update',
    'tasks.delete',
    'resources.view',
    'reports.view'
  ],
  'Customer Support': [
    'contacts.view',
    'contacts.update',
    'tasks.view',
    'tasks.create',
    'tasks.update',
    'projects.view',
    'reports.view'
  ]
};

async function seedDepartmentPermissions() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/erp-system';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Get Department model
    const Department = mongoose.model('Department');

    let updatedCount = 0;
    let notFoundCount = 0;

    // Update each department with permissions
    for (const [deptName, permissions] of Object.entries(departmentPermissionsMap)) {
      const department = await Department.findOne({ name: deptName });
      
      if (department) {
        department.permissions = permissions;
        await department.save();
        console.log(`✅ Updated ${deptName} with ${permissions.length} permissions`);
        updatedCount++;
      } else {
        console.log(`⚠️  Department "${deptName}" not found - skipping`);
        notFoundCount++;
      }
    }

    console.log('\n📊 Summary:');
    console.log(`   Updated: ${updatedCount} departments`);
    console.log(`   Not Found: ${notFoundCount} departments`);
    console.log('\n✅ Department permissions seeded successfully!');

  } catch (error) {
    console.error('❌ Error seeding department permissions:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the seed function
seedDepartmentPermissions();
