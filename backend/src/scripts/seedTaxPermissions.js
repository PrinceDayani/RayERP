const mongoose = require('mongoose');
const Permission = require('../models/Permission').Permission;
const Role = require('../models/Role').default;
require('dotenv').config();

const taxPermissions = [
  { name: 'tax:view', description: 'View tax records', category: 'Tax Management' },
  { name: 'tax:create', description: 'Create tax records', category: 'Tax Management' },
  { name: 'tax:update', description: 'Update tax records', category: 'Tax Management' },
  { name: 'tax:delete', description: 'Delete tax records', category: 'Tax Management' },
  { name: 'tax:export', description: 'Export tax records', category: 'Tax Management' },
  { name: 'tax:approve', description: 'Approve tax filings', category: 'Tax Management' }
];

async function seedTaxPermissions() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    for (const perm of taxPermissions) {
      await Permission.findOneAndUpdate(
        { name: perm.name },
        perm,
        { upsert: true, new: true }
      );
      console.log(`✓ Permission: ${perm.name}`);
    }

    // Assign to Admin role
    const adminRole = await Role.findOne({ name: 'Admin' });
    if (adminRole) {
      const permIds = await Permission.find({ category: 'Tax Management' }).select('_id');
      adminRole.permissions = [...new Set([...adminRole.permissions, ...permIds.map(p => p._id)])];
      await adminRole.save();
      console.log('✓ Assigned tax permissions to Admin role');
    }

    console.log('Tax permissions seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding tax permissions:', error);
    process.exit(1);
  }
}

seedTaxPermissions();
