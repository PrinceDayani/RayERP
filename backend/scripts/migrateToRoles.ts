import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Role } from '../src/models/Role';
import User from '../src/models/User';
import { seedDefaultRoles } from '../src/utils/seedDefaultRoles';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/erp-system';

async function migrateToRoles() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✓ Connected to MongoDB');

    // Step 1: Seed default roles
    console.log('\n📦 Seeding default roles...');
    await seedDefaultRoles();

    // Step 2: Get all roles
    const rootRole = await Role.findOne({ name: 'Root' });
    const superadminRole = await Role.findOne({ name: 'Superadmin' });
    const adminRole = await Role.findOne({ name: 'Admin' });

    if (!rootRole || !superadminRole || !adminRole) {
      throw new Error('Default roles not found. Please run seedDefaultRoles first.');
    }

    console.log('\n🔄 Migrating users...');

    // Step 3: Migrate users with old role enum values
    const users = await User.find({});
    let migratedCount = 0;

    for (const user of users) {
      const oldRole = (user as any).role;
      
      // Skip if already migrated (role is ObjectId)
      if (mongoose.Types.ObjectId.isValid(oldRole)) {
        console.log(`  ⏭️  Skipping ${user.email} - already migrated`);
        continue;
      }

      let newRoleId;
      
      // Map old enum values to new role IDs
      switch (oldRole) {
        case 'root':
          newRoleId = rootRole._id;
          break;
        case 'super_admin':
          newRoleId = superadminRole._id;
          break;
        case 'admin':
          newRoleId = adminRole._id;
          break;
        case 'manager':
        case 'member':
        case 'normal':
        default:
          // Create a default "Employee" role if it doesn't exist
          let employeeRole = await Role.findOne({ name: 'Employee' });
          if (!employeeRole) {
            employeeRole = await Role.create({
              name: 'Employee',
              description: 'Standard employee with basic access',
              permissions: ['view_projects', 'view_reports'],
              level: 50,
              isDefault: false,
              isActive: true
            });
            console.log('  ✓ Created Employee role');
          }
          newRoleId = employeeRole._id;
          break;
      }

      // Update user with new role reference
      await User.updateOne(
        { _id: user._id },
        { $set: { role: newRoleId } }
      );

      console.log(`  ✓ Migrated ${user.email}: ${oldRole} → ${newRoleId}`);
      migratedCount++;
    }

    console.log(`\n✅ Migration complete! Migrated ${migratedCount} users.`);
    console.log('\n📊 Summary:');
    console.log(`  - Root users: ${await User.countDocuments({ role: rootRole._id })}`);
    console.log(`  - Superadmin users: ${await User.countDocuments({ role: superadminRole._id })}`);
    console.log(`  - Admin users: ${await User.countDocuments({ role: adminRole._id })}`);
    
    const employeeRole = await Role.findOne({ name: 'Employee' });
    if (employeeRole) {
      console.log(`  - Employee users: ${await User.countDocuments({ role: employeeRole._id })}`);
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n✓ Disconnected from MongoDB');
  }
}

// Run migration
migrateToRoles();
