const mongoose = require('mongoose');
require('dotenv').config();

const syncEmployeesUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);

    const normalRole = await db.collection('roles').findOne({ name: 'Normal' });
    if (!normalRole) {
      console.log('❌ Normal role not found. Please seed roles first.');
      process.exit(1);
    }

    console.log('\n🔄 Starting Employee-User Synchronization...\n');

    // Step 1: Create users for employees without them or with invalid user references
    console.log('📋 Step 1: Creating users for employees without valid user accounts...');
    const allEmployees = await db.collection('employees').find({}).toArray();
    const employeesWithoutUsers = [];
    
    for (const emp of allEmployees) {
      if (!emp.user) {
        employeesWithoutUsers.push(emp);
      } else {
        const userExists = await db.collection('users').findOne({ _id: emp.user });
        if (!userExists) {
          employeesWithoutUsers.push(emp);
        }
      }
    }

    let usersCreated = 0;
    for (const emp of employeesWithoutUsers) {
      try {
        const existingUser = await db.collection('users').findOne({ email: emp.email });
        
        if (existingUser) {
          await db.collection('employees').updateOne(
            { _id: emp._id },
            { $set: { user: existingUser._id } }
          );
          console.log(`  🔗 Linked ${emp.firstName} ${emp.lastName} to existing user`);
        } else {
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

          await db.collection('employees').updateOne(
            { _id: emp._id },
            { $set: { user: user.insertedId } }
          );
          
          console.log(`  ✅ Created user for ${emp.firstName} ${emp.lastName}`);
        }
        usersCreated++;
      } catch (error) {
        console.log(`  ❌ Failed for ${emp.firstName} ${emp.lastName}: ${error.message}`);
      }
    }

    // Step 2: Sync user names with employee names
    console.log('\n📋 Step 2: Syncing user names with employee names...');
    const employeesWithUsers = await db.collection('employees').find({ user: { $exists: true, $ne: null } }).toArray();
    
    let namesSynced = 0;
    for (const emp of employeesWithUsers) {
      try {
        const user = await db.collection('users').findOne({ _id: emp.user });
        if (user) {
          const expectedName = `${emp.firstName} ${emp.lastName}`;
          if (user.name !== expectedName) {
            await db.collection('users').updateOne(
              { _id: user._id },
              { $set: { name: expectedName, updatedAt: new Date() } }
            );
            console.log(`  🔄 Updated user name: ${user.name} → ${expectedName}`);
            namesSynced++;
          }
        }
      } catch (error) {
        console.log(`  ❌ Failed to sync ${emp.firstName} ${emp.lastName}: ${error.message}`);
      }
    }

    // Step 3: Sync emails
    console.log('\n📋 Step 3: Syncing emails between employees and users...');
    let emailsSynced = 0;
    for (const emp of employeesWithUsers) {
      try {
        const user = await db.collection('users').findOne({ _id: emp.user });
        if (user && user.email !== emp.email) {
          await db.collection('users').updateOne(
            { _id: user._id },
            { $set: { email: emp.email, updatedAt: new Date() } }
          );
          console.log(`  📧 Updated email: ${user.email} → ${emp.email}`);
          emailsSynced++;
        }
      } catch (error) {
        console.log(`  ❌ Failed to sync email for ${emp.firstName} ${emp.lastName}: ${error.message}`);
      }
    }

    // Step 4: Remove orphaned users (users without employees)
    console.log('\n📋 Step 4: Checking for orphaned users...');
    const allUsers = await db.collection('users').find({}).toArray();
    const employeeUserIds = employeesWithUsers.map(e => e.user?.toString()).filter(Boolean);
    
    let orphanedCount = 0;
    for (const user of allUsers) {
      if (!employeeUserIds.includes(user._id.toString())) {
        const isRootOrAdmin = await db.collection('roles').findOne({ 
          _id: user.role,
          name: { $in: ['Root', 'Superadmin', 'Admin'] }
        });
        
        if (!isRootOrAdmin) {
          console.log(`  ⚠️  Found orphaned user: ${user.name} (${user.email})`);
          orphanedCount++;
        }
      }
    }

    // Step 5: Validate all employees have users
    console.log('\n📋 Step 5: Validating all employees have users...');
    const invalidEmployees = await db.collection('employees').find({
      $or: [{ user: { $exists: false } }, { user: null }]
    }).toArray();

    console.log('\n' + '='.repeat(50));
    console.log('📊 Synchronization Summary:');
    console.log('='.repeat(50));
    console.log(`  Users Created/Linked:     ${usersCreated}`);
    console.log(`  Names Synced:             ${namesSynced}`);
    console.log(`  Emails Synced:            ${emailsSynced}`);
    console.log(`  Orphaned Users Found:     ${orphanedCount}`);
    console.log(`  Invalid Employees:        ${invalidEmployees.length}`);
    console.log('='.repeat(50));

    if (invalidEmployees.length === 0) {
      console.log('\n✅ All employees are properly synced with users!');
    } else {
      console.log('\n⚠️  Some employees still need attention');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

syncEmployeesUsers();
