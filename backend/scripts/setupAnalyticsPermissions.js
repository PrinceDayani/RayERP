const mongoose = require('mongoose');
require('dotenv').config();

const ANALYTICS_PERMISSIONS = [
  { name: 'analytics.financial', description: 'View financial analytics', category: 'Analytics', isActive: true },
  { name: 'analytics.sales', description: 'View sales analytics', category: 'Analytics', isActive: true },
  { name: 'analytics.inventory', description: 'View inventory analytics', category: 'Analytics', isActive: true },
  { name: 'reports.view', description: 'View reports', category: 'Reports & Analytics', isActive: true },
  { name: 'reports.create', description: 'Create custom reports', category: 'Reports & Analytics', isActive: true },
  { name: 'reports.export', description: 'Export reports', category: 'Reports & Analytics', isActive: true },
  { name: 'reports.schedule', description: 'Schedule reports', category: 'Reports & Analytics', isActive: true }
];

async function setupAnalyticsPermissions() {
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

    console.log('📝 Setting up analytics & reports permissions...\n');

    let created = 0, updated = 0;

    for (const perm of ANALYTICS_PERMISSIONS) {
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

    console.log(`\n📊 Summary: Created ${created}, Updated ${updated}\n`);
    console.log('✅ Analytics & Reports permissions setup completed!\n');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
}

setupAnalyticsPermissions();
