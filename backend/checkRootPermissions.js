const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

const checkRootPermissions = async () => {
  await connectDB();

  try {
    const User = mongoose.model('User', new mongoose.Schema({
      name: String,
      email: String,
      role: { type: mongoose.Schema.Types.ObjectId, ref: 'Role' }
    }));

    const Role = mongoose.model('Role', new mongoose.Schema({
      name: String,
      level: Number,
      permissions: [String],
      isActive: Boolean
    }));

    console.log('\n📊 Checking Root User Configuration...\n');

    // Find all users
    const users = await User.find().populate('role');
    console.log(`Total Users: ${users.length}\n`);

    // Find root users
    const rootUsers = users.filter(u => {
      const roleName = u.role?.name || '';
      return roleName.toLowerCase().includes('root');
    });

    if (rootUsers.length === 0) {
      console.log('⚠️  No ROOT users found!\n');
    } else {
      console.log(`✅ Found ${rootUsers.length} ROOT user(s):\n`);
      rootUsers.forEach(user => {
        console.log(`  User: ${user.name} (${user.email})`);
        console.log(`  Role: ${user.role?.name}`);
        console.log(`  Level: ${user.role?.level}`);
        console.log(`  Active: ${user.role?.isActive}`);
        console.log(`  Permissions: ${user.role?.permissions?.length || 0} permissions`);
        if (user.role?.permissions?.length > 0) {
          console.log(`  Sample Permissions: ${user.role.permissions.slice(0, 5).join(', ')}...`);
        }
        console.log('');
      });
    }

    // Check all roles
    console.log('\n📋 All Roles in Database:\n');
    const allRoles = await Role.find().sort({ level: -1 });
    allRoles.forEach(role => {
      console.log(`  ${role.name} (Level: ${role.level}, Active: ${role.isActive}, Permissions: ${role.permissions?.length || 0})`);
    });

    // Check for Root role specifically
    console.log('\n🔍 Checking Root Role Configuration:\n');
    const rootRole = await Role.findOne({ name: 'Root' });
    if (!rootRole) {
      console.log('❌ Root role not found in database!');
      console.log('   This is the problem - Root role needs to be created.');
    } else {
      console.log('✅ Root role exists:');
      console.log(`   Level: ${rootRole.level}`);
      console.log(`   Active: ${rootRole.isActive}`);
      console.log(`   Permissions: ${rootRole.permissions?.length || 0}`);
      
      if (rootRole.level < 80) {
        console.log(`   ⚠️  WARNING: Root level is ${rootRole.level}, should be >= 80 for bypass`);
      }
      
      if (!rootRole.isActive) {
        console.log('   ❌ WARNING: Root role is INACTIVE!');
      }

      // Check for essential permissions
      const essentialPerms = ['view_employees', 'view_projects', 'view_tasks'];
      const missingPerms = essentialPerms.filter(p => !rootRole.permissions?.includes(p));
      
      if (missingPerms.length > 0) {
        console.log(`   ⚠️  Missing essential permissions: ${missingPerms.join(', ')}`);
      } else {
        console.log('   ✅ Has essential view permissions');
      }
    }

    // Check employees
    const Employee = mongoose.model('Employee', new mongoose.Schema({
      name: String,
      email: String,
      departments: [String]
    }));

    console.log('\n👥 Checking Employees:\n');
    const employees = await Employee.find();
    console.log(`Total Employees: ${employees.length}`);

    // Check projects
    const Project = mongoose.model('Project', new mongoose.Schema({
      name: String,
      status: String
    }));

    console.log('\n📁 Checking Projects:\n');
    const projects = await Project.find();
    console.log(`Total Projects: ${projects.length}`);

    // Check tasks
    const Task = mongoose.model('Task', new mongoose.Schema({
      title: String,
      status: String
    }));

    console.log('\n✅ Checking Tasks:\n');
    const tasks = await Task.find();
    console.log(`Total Tasks: ${tasks.length}`);

    console.log('\n' + '='.repeat(60));
    console.log('DIAGNOSIS SUMMARY');
    console.log('='.repeat(60));
    
    if (!rootRole) {
      console.log('❌ ISSUE: Root role does not exist');
      console.log('   SOLUTION: Run seed script to create Root role');
    } else if (rootRole.level < 80) {
      console.log('❌ ISSUE: Root role level is too low');
      console.log('   SOLUTION: Update Root role level to 100');
    } else if (!rootRole.isActive) {
      console.log('❌ ISSUE: Root role is inactive');
      console.log('   SOLUTION: Activate Root role');
    } else if (rootUsers.length === 0) {
      console.log('❌ ISSUE: No users assigned to Root role');
      console.log('   SOLUTION: Assign your user to Root role');
    } else {
      console.log('✅ Root configuration looks correct');
      console.log('   Check frontend API calls and network tab for errors');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
};

checkRootPermissions();
