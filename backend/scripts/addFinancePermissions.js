// Add finance permissions to ROOT and SUPER_ADMIN roles
const mongoose = require('mongoose');
require('dotenv').config();

const financePermissions = [
  'finance.view',
  'finance.manage',
  'finance.create',
  'finance.update',
  'finance.delete',
  'finance.reports',
  'accounting.view',
  'accounting.manage'
];

async function addFinancePermissions() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const Role = mongoose.model('Role', new mongoose.Schema({
      name: String,
      level: Number,
      permissions: [String]
    }));

    // Update ROOT and SUPER_ADMIN roles
    const rolesToUpdate = ['ROOT', 'SUPER_ADMIN', 'ADMIN'];
    
    for (const roleName of rolesToUpdate) {
      const role = await Role.findOne({ name: roleName });
      if (role) {
        const existingPerms = new Set(role.permissions || []);
        financePermissions.forEach(perm => existingPerms.add(perm));
        role.permissions = Array.from(existingPerms);
        await role.save();
        console.log(`✅ Updated ${roleName} with finance permissions`);
      } else {
        console.log(`⚠️  ${roleName} role not found`);
      }
    }

    console.log('\n✅ Finance permissions added successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

addFinancePermissions();
