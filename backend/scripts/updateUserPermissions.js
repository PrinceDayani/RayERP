const mongoose = require('mongoose');
require('dotenv').config();

const NEW_PERMISSIONS = [
  { name: 'users.activate_deactivate', description: 'Activate/deactivate users', category: 'Users' },
  { name: 'users.assign_roles', description: 'Assign roles to users', category: 'Users' },
  { name: 'users.reset_password', description: 'Reset user passwords', category: 'Users' },
  { name: 'users.change_password', description: 'Change user passwords', category: 'Users' },
  { name: 'users.request_status_change', description: 'Request user status changes', category: 'Users' },
  { name: 'users.approve_status_change', description: 'Approve user status changes', category: 'Users' }
];

async function updateUserPermissions() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/rayerp');
    console.log('✅ Connected to MongoDB\n');

    const PermissionSchema = new mongoose.Schema({
      name: { type: String, required: true, unique: true },
      description: String,
      category: String,
      isActive: { type: Boolean, default: true }
    }, { timestamps: true });

    const Permission = mongoose.models.Permission || mongoose.model('Permission', PermissionSchema);

    console.log('📝 Adding new user management permissions...');
    let createdCount = 0;

    for (const perm of NEW_PERMISSIONS) {
      const existing = await Permission.findOne({ name: perm.name });
      if (!existing) {
        await Permission.create(perm);
        console.log(`  ✓ Created: ${perm.name}`);
        createdCount++;
      } else {
        console.log(`  - Already exists: ${perm.name}`);
      }
    }

    console.log(`\n📊 Summary: ${createdCount} new permissions added\n`);
    console.log('✅ User permissions update completed!\n');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

updateUserPermissions();