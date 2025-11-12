const mongoose = require('mongoose');
require('dotenv').config();

async function initPermissions() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✓ Connected to MongoDB');

    const Department = mongoose.model('Department', new mongoose.Schema({
      name: String,
      description: String,
      manager: Object,
      location: String,
      budget: Number,
      status: String,
      employeeCount: Number,
      permissions: [String]
    }, { timestamps: true }));

    // Get all departments
    const departments = await Department.find();
    console.log(`\n✓ Found ${departments.length} departments`);

    // Initialize permissions field if it doesn't exist
    let updated = 0;
    for (const dept of departments) {
      if (!dept.permissions) {
        dept.permissions = [];
        await dept.save();
        updated++;
        console.log(`  ✓ Initialized permissions for: ${dept.name}`);
      } else {
        console.log(`  - ${dept.name} already has permissions field (${dept.permissions.length} permissions)`);
      }
    }

    console.log(`\n✅ Done! Updated ${updated} departments`);
    console.log('\nNow you can:');
    console.log('1. Refresh your frontend');
    console.log('2. Click the Shield button on any department');
    console.log('3. Add permissions like: projects.view, tasks.create, etc.');
    
  } catch (error) {
    console.error('✗ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

initPermissions();
