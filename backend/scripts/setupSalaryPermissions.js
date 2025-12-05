/**
 * Quick Setup Script for Salary Permissions
 * Run: node scripts/setupSalaryPermissions.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const SALARY_PERMISSIONS = [
  { 
    name: 'employees.view_salary', 
    description: 'View employee salary information', 
    category: 'Employees',
    isActive: true
  },
  { 
    name: 'employees.edit_salary', 
    description: 'Edit employee salary information', 
    category: 'Employees',
    isActive: true
  }
];

async function setupSalaryPermissions() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/rayerp');
    console.log('✅ Connected to MongoDB\n');

    // Define schemas
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

    console.log('📝 Setting up salary permissions...\n');

    // Step 1: Create/Update Permissions
    let created = 0;
    let updated = 0;

    for (const perm of SALARY_PERMISSIONS) {
      const existing = await Permission.findOne({ name: perm.name });
      if (!existing) {
        await Permission.create(perm);
        console.log(`  ✓ Created: ${perm.name}`);
        created++;
      } else {
        await Permission.updateOne({ name: perm.name }, perm);
        console.log(`  ✓ Updated: ${perm.name}`);
        updated++;
      }
    }

    console.log(`\n📊 Permissions Summary:`);
    console.log(`   Created: ${created}`);
    console.log(`   Updated: ${updated}\n`);

    // Step 2: Update Root Role Only
    console.log('🔐 Updating Root role...\n');

    const rootRole = await Role.findOne({ name: 'Root' });
    if (rootRole) {
      rootRole.permissions = ['*'];
      await rootRole.save();
      console.log('  ✓ Root role has all permissions (*)\n');
    }
    
    console.log('📝 Note: Only Root role is updated.');
    console.log('   Other roles (Admin, Manager, etc.) must be created via UI.');

    console.log('\n✅ Salary permissions setup completed successfully!\n');
    console.log('📋 Permissions Added:');
    console.log('   - employees.view_salary');
    console.log('   - employees.edit_salary\n');
    console.log('👑 Only Root has permissions by default.');
    console.log('   Create custom roles via Role Management UI.\n');
    console.log('📝 Next Steps:');
    console.log('   1. Restart backend server');
    console.log('   2. Login as Root');
    console.log('   3. Create custom roles and assign permissions\n');

  } catch (error) {
    console.error('❌ Error setting up salary permissions:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
}

setupSalaryPermissions();
