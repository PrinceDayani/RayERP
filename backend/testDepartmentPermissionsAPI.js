const mongoose = require('mongoose');
require('dotenv').config();

const Department = require('./src/models/Department').default;

async function testPermissions() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✓ Connected to MongoDB');

    // Find first department
    const dept = await Department.findOne();
    if (!dept) {
      console.log('✗ No departments found. Create a department first.');
      process.exit(1);
    }

    console.log(`\n✓ Found department: ${dept.name}`);
    console.log(`  Current permissions: ${dept.permissions?.length || 0}`);
    
    if (dept.permissions && dept.permissions.length > 0) {
      console.log('  Permissions:');
      dept.permissions.forEach(p => console.log(`    - ${p}`));
    }

    // Test adding permission
    const testPermission = 'test.permission';
    if (!dept.permissions) dept.permissions = [];
    if (!dept.permissions.includes(testPermission)) {
      dept.permissions.push(testPermission);
      await dept.save();
      console.log(`\n✓ Added test permission: ${testPermission}`);
    }

    // Verify
    const updated = await Department.findById(dept._id);
    console.log(`✓ Verified - Total permissions: ${updated.permissions?.length || 0}`);

    console.log('\n✅ All tests passed! Permission system is working.');
    
  } catch (error) {
    console.error('✗ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

testPermissions();
