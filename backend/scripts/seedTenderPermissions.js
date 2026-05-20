/**
 * Seed Tender Management Permissions
 * Run: node scripts/seedTenderPermissions.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const TENDER_PERMISSIONS = [
  { name: 'tenders.view', description: 'View tenders', category: 'Tender Management', isActive: true },
  { name: 'tenders.create', description: 'Create tenders', category: 'Tender Management', isActive: true },
  { name: 'tenders.edit', description: 'Edit tenders', category: 'Tender Management', isActive: true },
  { name: 'tenders.delete', description: 'Delete tenders', category: 'Tender Management', isActive: true },
  { name: 'tenders.manage', description: 'Manage tender lifecycle (status transitions)', category: 'Tender Management', isActive: true },
  { name: 'tenders.manage_bids', description: 'Manage bids and bidders', category: 'Tender Management', isActive: true },
  { name: 'tenders.evaluate', description: 'Evaluate and score bids', category: 'Tender Management', isActive: true },
  { name: 'tenders.award', description: 'Award tenders and generate work orders', category: 'Tender Management', isActive: true }
];

async function seedTenderPermissions() {
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

    console.log('📝 Seeding Tender Permissions...\n');

    let created = 0, updated = 0;

    for (const perm of TENDER_PERMISSIONS) {
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

    // Update Root role (has all permissions via *)
    const rootRole = await Role.findOne({ name: 'Root' });
    if (rootRole) {
      if (!rootRole.permissions.includes('*')) {
        rootRole.permissions.push('*');
        await rootRole.save();
      }
      console.log('  ✓ Root role confirmed (all permissions via *)\n');
    }

    // Add tender permissions to Admin role
    const adminRole = await Role.findOne({ name: { $in: ['Admin', 'Superadmin'] } });
    if (adminRole) {
      const tenderPerms = TENDER_PERMISSIONS.map(p => p.name);
      const newPerms = tenderPerms.filter(p => !adminRole.permissions.includes(p));
      if (newPerms.length > 0) {
        adminRole.permissions.push(...newPerms);
        await adminRole.save();
        console.log(`  ✓ Updated ${adminRole.name} role with ${newPerms.length} tender permissions`);
      }
    }

    // Add view + manage_bids to Manager role
    const managerRole = await Role.findOne({ name: 'Manager' });
    if (managerRole) {
      const managerPerms = ['tenders.view', 'tenders.create', 'tenders.edit', 'tenders.manage_bids'];
      const newPerms = managerPerms.filter(p => !managerRole.permissions.includes(p));
      if (newPerms.length > 0) {
        managerRole.permissions.push(...newPerms);
        await managerRole.save();
        console.log(`  ✓ Updated Manager role with ${newPerms.length} tender permissions`);
      }
    }

    console.log('\n✅ Tender permissions seeding completed!\n');
    console.log('📋 Permissions Added:');
    TENDER_PERMISSIONS.forEach(p => console.log(`   - ${p.name}: ${p.description}`));
    console.log('\n📝 Next Steps:');
    console.log('   1. Restart your backend server');
    console.log('   2. Assign tender permissions to roles via Role Management UI');
    console.log('   3. Test tender creation at POST /api/tenders\n');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
}

seedTenderPermissions();
