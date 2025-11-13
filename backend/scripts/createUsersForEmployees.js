const mongoose = require('mongoose');
require('dotenv').config();

const createUsersForEmployees = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);

    // Find Normal role
    const normalRole = await db.collection('roles').findOne({ name: 'Normal' });
    if (!normalRole) {
      console.log('❌ Normal role not found. Please seed roles first.');
      process.exit(1);
    }

    // Find employees without user accounts
    const employees = await db.collection('employees').find({ 
      $or: [
        { user: { $exists: false } },
        { user: null }
      ]
    }).toArray();

    if (employees.length === 0) {
      console.log('✅ All employees already have user accounts');
      process.exit(0);
    }

    console.log(`\n📋 Found ${employees.length} employees without user accounts`);
    let created = 0;
    let skipped = 0;

    for (const emp of employees) {
      try {
        // Check if user with this email already exists
        const existingUser = await db.collection('users').findOne({ email: emp.email });
        
        if (existingUser) {
          // Link existing user to employee
          await db.collection('employees').updateOne(
            { _id: emp._id },
            { $set: { user: existingUser._id } }
          );
          console.log(`🔗 Linked ${emp.firstName} ${emp.lastName} to existing user`);
          created++;
        } else {
          // Create new user
          const hashedPassword = await bcrypt.hash(emp.employeeId, salt);
          const user = await db.collection('users').insertOne({
            name: `${emp.firstName} ${emp.lastName}`,
            email: emp.email,
            password: hashedPassword,
            role: normalRole._id,
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date()
          });

          // Update employee with user reference
          await db.collection('employees').updateOne(
            { _id: emp._id },
            { $set: { user: user.insertedId } }
          );
          
          console.log(`✅ Created user for ${emp.firstName} ${emp.lastName} (${emp.email})`);
          created++;
        }
      } catch (error) {
        console.log(`❌ Failed for ${emp.firstName} ${emp.lastName}: ${error.message}`);
        skipped++;
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Created/Linked: ${created}`);
    console.log(`   ❌ Skipped: ${skipped}`);
    console.log(`\n🎉 Migration completed!`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

createUsersForEmployees();
