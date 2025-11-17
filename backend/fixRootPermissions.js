const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

const fixRootPermissions = async () => {
  await connectDB();

  try {
    const Role = mongoose.model('Role', new mongoose.Schema({
      name: String,
      level: Number,
      permissions: [String],
      isActive: Boolean,
      isDefault: Boolean,
      description: String
    }));

    console.log('\n🔧 Fixing Root Role Permissions...\n');

    // All possible permissions
    const allPermissions = [
      '*', // Wildcard permission
      // Employee permissions
      'view_employees',
      'create_employee',
      'update_employee',
      'delete_employee',
      'manage_employees',
      // Project permissions
      'view_projects',
      'create_project',
      'update_project',
      'delete_project',
      'manage_projects',
      // Task permissions
      'view_tasks',
      'create_task',
      'update_task',
      'delete_task',
      'manage_tasks',
      // User permissions
      'view_users',
      'create_user',
      'update_user',
      'delete_user',
      'manage_users',
      // Role permissions
      'view_roles',
      'create_role',
      'update_role',
      'delete_role',
      'manage_roles',
      // Department permissions
      'view_departments',
      'create_department',
      'update_department',
      'delete_department',
      'manage_departments',
      // Finance permissions
      'view_finance',
      'create_finance',
      'update_finance',
      'delete_finance',
      'manage_finance',
      // Analytics permissions
      'view_analytics',
      'view_reports',
      'export_data',
      // System permissions
      'system_admin',
      'manage_settings',
      'view_logs',
      'manage_permissions'
    ];

    // Update Root role
    const rootRole = await Role.findOneAndUpdate(
      { name: 'Root' },
      {
        $set: {
          name: 'Root',
          level: 100,
          permissions: allPermissions,
          isActive: true,
          isDefault: true,
          description: 'Root user with complete system access'
        }
      },
      { upsert: true, new: true }
    );

    console.log('✅ Root role updated successfully!');
    console.log(`   Level: ${rootRole.level}`);
    console.log(`   Active: ${rootRole.isActive}`);
    console.log(`   Permissions: ${rootRole.permissions.length}`);
    console.log(`   Sample permissions: ${rootRole.permissions.slice(0, 10).join(', ')}...\n`);

    // Also update Superadmin role
    const superadminRole = await Role.findOneAndUpdate(
      { name: 'Superadmin' },
      {
        $set: {
          name: 'Superadmin',
          level: 90,
          permissions: allPermissions.filter(p => p !== '*'), // All except wildcard
          isActive: true,
          isDefault: true,
          description: 'Super administrator with elevated privileges'
        }
      },
      { upsert: true, new: true }
    );

    console.log('✅ Superadmin role updated successfully!');
    console.log(`   Level: ${superadminRole.level}`);
    console.log(`   Permissions: ${superadminRole.permissions.length}\n`);

    // Verify Root user
    const User = mongoose.model('User', new mongoose.Schema({
      name: String,
      email: String,
      role: { type: mongoose.Schema.Types.ObjectId, ref: 'Role' }
    }));

    const rootUser = await User.findOne({ email: 'princedayani10@gmail.com' }).populate('role');
    
    if (rootUser) {
      console.log('✅ Root user found:');
      console.log(`   Name: ${rootUser.name}`);
      console.log(`   Email: ${rootUser.email}`);
      console.log(`   Role: ${rootUser.role?.name}`);
      console.log(`   Role Level: ${rootUser.role?.level}`);
      
      // Update user's role if needed
      if (rootUser.role?.name !== 'Root') {
        console.log('\n⚠️  User is not assigned to Root role. Updating...');
        await User.findByIdAndUpdate(rootUser._id, { role: rootRole._id });
        console.log('✅ User role updated to Root');
      }
    } else {
      console.log('⚠️  Root user not found with email: princedayani10@gmail.com');
    }

    console.log('\n' + '='.repeat(60));
    console.log('FIX COMPLETED SUCCESSFULLY');
    console.log('='.repeat(60));
    console.log('✅ Root role now has all permissions');
    console.log('✅ Level is set to 100 (bypasses all permission checks)');
    console.log('✅ Role is active');
    console.log('\nNext steps:');
    console.log('1. Restart your backend server');
    console.log('2. Clear browser cache and localStorage');
    console.log('3. Login again');
    console.log('4. You should now see all data');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
};

fixRootPermissions();
