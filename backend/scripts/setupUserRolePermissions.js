/**
 * Setup User & Role Management Permissions
 * Run: node scripts/setupUserRolePermissions.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const USER_ROLE_PERMISSIONS = [
  // User Management (7 permissions)
  { name: 'users.view', description: 'View users', category: 'Users' },
  { name: 'users.create', description: 'Create new users', category: 'Users' },
  { name: 'users.edit', description: 'Edit user information', category: 'Users' },
  { name: 'users.delete', description: 'Delete users', category: 'Users' },
  { name: 'users.assign_roles', description: 'Assign roles to users', category: 'Users' },
  { name: 'users.reset_password', description: 'Reset user passwords', category: 'Users' },
  { name: 'users.activate_deactivate', description: 'Activate or deactivate users', category: 'Users' },
  
  // Role Management (4 permissions)
  { name: 'roles.view', description: 'View roles', category: 'Roles' },
  { name: 'roles.create', description: 'Create new roles', category: 'Roles' },
  { name: 'roles.edit', description: 'Edit role information and permissions', category: 'Roles' },
  { name: 'roles.delete', description: 'Delete roles', category: 'Roles' }
];

async function setupPermissions() {
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
      level: Number
    });

    const Permission = mongoose.models.Permission || mongoose.model('Permission', PermissionSchema);
    const Role = mongoose.models.Role || mongoose.model('Role', RoleSchema);

    console.log('📝 Setting up User & Role permissions...\n');

    let created = 0, updated = 0;

    for (const perm of USER_ROLE_PERMISSIONS) {
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

    console.log(`\n📊 Summary: ${created} created, ${updated} updated\n`);

    // Update Root role only
    const rootRole = await Role.findOne({ name: 'Root' });
    if (rootRole) {
      rootRole.permissions = ['*'];
      await rootRole.save();
      console.log('✓ Root role updated (all permissions)\n');
    }
    
    console.log('📝 Note: Only Root role is updated.');
    console.log('   Create custom roles via UI and assign permissions manually.\n');

    console.log('✅ Setup complete!\n');
    console.log('📋 Permissions added:');
    console.log('   User Management: 7 permissions');
    console.log('   Role Management: 4 permissions');
    console.log('\n👑 Only Root has permissions by default.');
    console.log('   Create other roles via Role Management UI.\n');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

setupPermissions();
