/**
 * Setup Script for User Management Permissions
 * Run: node scripts/setupUserPermissions.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const USER_PERMISSIONS = [
  { 
    name: 'users.view', 
    description: 'View user information', 
    category: 'Users',
    isActive: true
  },
  { 
    name: 'users.create', 
    description: 'Create new users', 
    category: 'Users',
    isActive: true
  },
  { 
    name: 'users.edit', 
    description: 'Edit user information', 
    category: 'Users',
    isActive: true
  },
  { 
    name: 'users.delete', 
    description: 'Delete users', 
    category: 'Users',
    isActive: true
  },
  { 
    name: 'users.manage', 
    description: 'Full user management access', 
    category: 'Users',
    isActive: true
  },
  { 
    name: 'users.assign_roles', 
    description: 'Assign roles to users', 
    category: 'Users',
    isActive: true
  },
  { 
    name: 'users.reset_password', 
    description: 'Reset user passwords', 
    category: 'Users',
    isActive: true
  },
  { 
    name: 'users.activate_deactivate', 
    description: 'Activate or deactivate users', 
    category: 'Users',
    isActive: true
  }
];

async function setupUserPermissions() {
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

    console.log('📝 Setting up user management permissions...\n');

    let created = 0;
    let updated = 0;

    for (const perm of USER_PERMISSIONS) {
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

    console.log('🔐 Updating Root role...\n');

    const rootRole = await Role.findOne({ name: 'Root' });
    if (rootRole) {
      rootRole.permissions = ['*'];
      await rootRole.save();
      console.log('  ✓ Root role has all permissions (*)\n');
    }

    console.log('✅ User management permissions setup completed!\n');
    console.log('📋 Permissions Added:');
    USER_PERMISSIONS.forEach(p => console.log(`   - ${p.name}`));
    console.log('\n👑 Root has all permissions by default.');
    console.log('   Create custom roles via Role Management UI.\n');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
}

setupUserPermissions();
