const mongoose = require('mongoose');
require('dotenv').config();

const populateERP = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;

    // Clear existing data
    console.log('\n🗑️  Clearing existing data...');
    await db.collection('roles').deleteMany({});
    await db.collection('users').deleteMany({});
    await db.collection('departments').deleteMany({});
    await db.collection('employees').deleteMany({});
    await db.collection('projects').deleteMany({});
    await db.collection('tasks').deleteMany({});
    await db.collection('contacts').deleteMany({});
    await db.collection('departmentbudgets').deleteMany({});
    console.log('✅ Cleared existing data');

    // 1. Create Roles
    console.log('\n👑 Creating roles...');
    const roles = await db.collection('roles').insertMany([
      {
        name: 'Root',
        description: 'System administrator with full access',
        permissions: ['*'],
        isActive: true,
        isDefault: true,
        level: 100,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Superadmin',
        description: 'Administrative access to all modules',
        permissions: ['admin.*', 'employee.*', 'project.*', 'task.*', 'budget.*', 'analytics.*'],
        isActive: true,
        isDefault: true,
        level: 90,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Admin',
        description: 'Department-level administrative access',
        permissions: ['employee.read', 'employee.create', 'project.*', 'task.*', 'budget.read'],
        isActive: true,
        isDefault: true,
        level: 80,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Manager',
        description: 'Team and project management access',
        permissions: ['project.*', 'task.*', 'employee.read', 'budget.read'],
        isActive: true,
        isDefault: true,
        level: 70,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Employee',
        description: 'Basic user access to assigned tasks',
        permissions: ['task.read', 'task.update', 'project.read', 'employee.read.own'],
        isActive: true,
        isDefault: true,
        level: 60,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
    console.log('✅ Created roles');

    // 2. Create Departments
    console.log('\n🏢 Creating departments...');
    const departments = await db.collection('departments').insertMany([
      {
        name: 'Information Technology',
        description: 'Software development and IT infrastructure',
        manager: { name: 'John Smith', email: 'john.smith@rayerp.com', phone: '+1-555-0101' },
        location: 'Building A, Floor 3',
        budget: 500000,
        status: 'active',
        employeeCount: 0,
        permissions: ['project.*', 'task.*', 'employee.read'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Human Resources',
        description: 'Employee management and organizational development',
        manager: { name: 'Sarah Johnson', email: 'sarah.johnson@rayerp.com', phone: '+1-555-0102' },
        location: 'Building B, Floor 2',
        budget: 300000,
        status: 'active',
        employeeCount: 0,
        permissions: ['employee.*', 'budget.read'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Finance',
        description: 'Financial planning and accounting',
        manager: { name: 'Michael Brown', email: 'michael.brown@rayerp.com', phone: '+1-555-0103' },
        location: 'Building A, Floor 1',
        budget: 250000,
        status: 'active',
        employeeCount: 0,
        permissions: ['budget.*', 'analytics.*'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Marketing',
        description: 'Brand management and customer acquisition',
        manager: { name: 'Emily Davis', email: 'emily.davis@rayerp.com', phone: '+1-555-0104' },
        location: 'Building B, Floor 3',
        budget: 400000,
        status: 'active',
        employeeCount: 0,
        permissions: ['project.read', 'analytics.read'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Operations',
        description: 'Business operations and process management',
        manager: { name: 'David Wilson', email: 'david.wilson@rayerp.com', phone: '+1-555-0105' },
        location: 'Building A, Floor 2',
        budget: 350000,
        status: 'active',
        employeeCount: 0,
        permissions: ['project.read', 'task.read', 'employee.read'],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
    console.log('✅ Created departments');

    // Get role and department IDs
    const roleMap = {};
    const rolesData = await db.collection('roles').find({}).toArray();
    rolesData.forEach(role => roleMap[role.name] = role._id);

    const deptMap = {};
    const deptsData = await db.collection('departments').find({}).toArray();
    deptsData.forEach(dept => deptMap[dept.name] = dept._id);

    // 3. Create Users
    console.log('\n👥 Creating users...');
    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    const users = await db.collection('users').insertMany([
      {
        name: 'Root Admin',
        email: 'root@rayerp.com',
        password: hashedPassword,
        role: roleMap['Root'],
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'John Smith',
        email: 'john.smith@rayerp.com',
        password: hashedPassword,
        role: roleMap['Superadmin'],
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Sarah Johnson',
        email: 'sarah.johnson@rayerp.com',
        password: hashedPassword,
        role: roleMap['Admin'],
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Michael Brown',
        email: 'michael.brown@rayerp.com',
        password: hashedPassword,
        role: roleMap['Manager'],
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Emily Davis',
        email: 'emily.davis@rayerp.com',
        password: hashedPassword,
        role: roleMap['Manager'],
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'David Wilson',
        email: 'david.wilson@rayerp.com',
        password: hashedPassword,
        role: roleMap['Manager'],
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Alice Cooper',
        email: 'alice.cooper@rayerp.com',
        password: hashedPassword,
        role: roleMap['Employee'],
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Bob Martinez',
        email: 'bob.martinez@rayerp.com',
        password: hashedPassword,
        role: roleMap['Employee'],
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Carol White',
        email: 'carol.white@rayerp.com',
        password: hashedPassword,
        role: roleMap['Employee'],
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Daniel Lee',
        email: 'daniel.lee@rayerp.com',
        password: hashedPassword,
        role: roleMap['Employee'],
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
    console.log('✅ Created users');

    // Get user IDs
    const userMap = {};
    const usersData = await db.collection('users').find({}).toArray();
    usersData.forEach(user => userMap[user.email] = user._id);

    // 4. Create Employees
    console.log('\n👨‍💼 Creating employees...');
    const employees = await db.collection('employees').insertMany([
      {
        employeeId: 'EMP001',
        firstName: 'John',
        lastName: 'Smith',
        email: 'john.smith@rayerp.com',
        phone: '+1-555-0101',
        department: 'Information Technology',
        departments: ['Information Technology'],
        position: 'IT Director',
        salary: 120000,
        hireDate: new Date('2022-01-15'),
        status: 'active',
        address: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA'
        },
        emergencyContact: {
          name: 'Jane Smith',
          relationship: 'Spouse',
          phone: '+1-555-0201'
        },
        skills: ['Leadership', 'Project Management', 'System Architecture'],
        user: userMap['john.smith@rayerp.com'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        employeeId: 'EMP002',
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: 'sarah.johnson@rayerp.com',
        phone: '+1-555-0102',
        department: 'Human Resources',
        departments: ['Human Resources'],
        position: 'HR Manager',
        salary: 85000,
        hireDate: new Date('2022-02-01'),
        status: 'active',
        address: {
          street: '456 Oak Ave',
          city: 'New York',
          state: 'NY',
          zipCode: '10002',
          country: 'USA'
        },
        emergencyContact: {
          name: 'Robert Johnson',
          relationship: 'Spouse',
          phone: '+1-555-0202'
        },
        skills: ['HR Management', 'Recruitment', 'Employee Relations'],
        user: userMap['sarah.johnson@rayerp.com'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        employeeId: 'EMP003',
        firstName: 'Michael',
        lastName: 'Brown',
        email: 'michael.brown@rayerp.com',
        phone: '+1-555-0103',
        department: 'Finance',
        departments: ['Finance'],
        position: 'Finance Manager',
        salary: 95000,
        hireDate: new Date('2022-03-01'),
        status: 'active',
        address: {
          street: '789 Pine St',
          city: 'New York',
          state: 'NY',
          zipCode: '10003',
          country: 'USA'
        },
        emergencyContact: {
          name: 'Lisa Brown',
          relationship: 'Spouse',
          phone: '+1-555-0203'
        },
        skills: ['Financial Analysis', 'Budgeting', 'Accounting'],
        user: userMap['michael.brown@rayerp.com'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        employeeId: 'EMP004',
        firstName: 'Emily',
        lastName: 'Davis',
        email: 'emily.davis@rayerp.com',
        phone: '+1-555-0104',
        department: 'Marketing',
        departments: ['Marketing'],
        position: 'Marketing Manager',
        salary: 80000,
        hireDate: new Date('2022-04-01'),
        status: 'active',
        address: {
          street: '321 Elm St',
          city: 'New York',
          state: 'NY',
          zipCode: '10004',
          country: 'USA'
        },
        emergencyContact: {
          name: 'Mark Davis',
          relationship: 'Spouse',
          phone: '+1-555-0204'
        },
        skills: ['Digital Marketing', 'Brand Management', 'Content Strategy'],
        user: userMap['emily.davis@rayerp.com'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        employeeId: 'EMP005',
        firstName: 'David',
        lastName: 'Wilson',
        email: 'david.wilson@rayerp.com',
        phone: '+1-555-0105',
        department: 'Operations',
        departments: ['Operations'],
        position: 'Operations Manager',
        salary: 90000,
        hireDate: new Date('2022-05-01'),
        status: 'active',
        address: {
          street: '654 Maple Ave',
          city: 'New York',
          state: 'NY',
          zipCode: '10005',
          country: 'USA'
        },
        emergencyContact: {
          name: 'Susan Wilson',
          relationship: 'Spouse',
          phone: '+1-555-0205'
        },
        skills: ['Operations Management', 'Process Improvement', 'Quality Control'],
        user: userMap['david.wilson@rayerp.com'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        employeeId: 'EMP006',
        firstName: 'Alice',
        lastName: 'Cooper',
        email: 'alice.cooper@rayerp.com',
        phone: '+1-555-0106',
        department: 'Information Technology',
        departments: ['Information Technology'],
        position: 'Senior Developer',
        salary: 75000,
        hireDate: new Date('2022-06-01'),
        status: 'active',
        address: {
          street: '987 Cedar St',
          city: 'New York',
          state: 'NY',
          zipCode: '10006',
          country: 'USA'
        },
        emergencyContact: {
          name: 'Tom Cooper',
          relationship: 'Brother',
          phone: '+1-555-0206'
        },
        skills: ['JavaScript', 'React', 'Node.js', 'MongoDB'],
        user: userMap['alice.cooper@rayerp.com'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        employeeId: 'EMP007',
        firstName: 'Bob',
        lastName: 'Martinez',
        email: 'bob.martinez@rayerp.com',
        phone: '+1-555-0107',
        department: 'Information Technology',
        departments: ['Information Technology'],
        position: 'DevOps Engineer',
        salary: 70000,
        hireDate: new Date('2022-07-01'),
        status: 'active',
        address: {
          street: '147 Birch Ave',
          city: 'New York',
          state: 'NY',
          zipCode: '10007',
          country: 'USA'
        },
        emergencyContact: {
          name: 'Maria Martinez',
          relationship: 'Mother',
          phone: '+1-555-0207'
        },
        skills: ['Docker', 'Kubernetes', 'AWS', 'CI/CD'],
        user: userMap['bob.martinez@rayerp.com'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        employeeId: 'EMP008',
        firstName: 'Carol',
        lastName: 'White',
        email: 'carol.white@rayerp.com',
        phone: '+1-555-0108',
        department: 'Marketing',
        departments: ['Marketing'],
        position: 'Marketing Specialist',
        salary: 55000,
        hireDate: new Date('2022-08-01'),
        status: 'active',
        address: {
          street: '258 Spruce St',
          city: 'New York',
          state: 'NY',
          zipCode: '10008',
          country: 'USA'
        },
        emergencyContact: {
          name: 'John White',
          relationship: 'Father',
          phone: '+1-555-0208'
        },
        skills: ['Social Media Marketing', 'Content Creation', 'Analytics'],
        user: userMap['carol.white@rayerp.com'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        employeeId: 'EMP009',
        firstName: 'Daniel',
        lastName: 'Lee',
        email: 'daniel.lee@rayerp.com',
        phone: '+1-555-0109',
        department: 'Finance',
        departments: ['Finance'],
        position: 'Financial Analyst',
        salary: 60000,
        hireDate: new Date('2022-09-01'),
        status: 'active',
        address: {
          street: '369 Willow Ave',
          city: 'New York',
          state: 'NY',
          zipCode: '10009',
          country: 'USA'
        },
        emergencyContact: {
          name: 'Grace Lee',
          relationship: 'Sister',
          phone: '+1-555-0209'
        },
        skills: ['Financial Modeling', 'Excel', 'Data Analysis'],
        user: userMap['daniel.lee@rayerp.com'],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
    console.log('✅ Created employees');

    // Get employee IDs
    const empMap = {};
    const empsData = await db.collection('employees').find({}).toArray();
    empsData.forEach(emp => empMap[emp.email] = emp._id);

    // 5. Create Projects
    console.log('\n📊 Creating projects...');
    const projects = await db.collection('projects').insertMany([
      {
        name: 'ERP System Enhancement',
        description: 'Upgrade and enhance the existing ERP system with new features',
        status: 'active',
        priority: 'high',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-06-30'),
        budget: 150000,
        spentBudget: 45000,
        progress: 30,
        autoCalculateProgress: true,
        manager: empMap['john.smith@rayerp.com'],
        team: [empMap['alice.cooper@rayerp.com'], empMap['bob.martinez@rayerp.com']],
        owner: userMap['john.smith@rayerp.com'],
        members: [userMap['alice.cooper@rayerp.com'], userMap['bob.martinez@rayerp.com']],
        departments: [deptMap['Information Technology']],
        client: 'Internal',
        tags: ['ERP', 'Enhancement', 'Internal'],
        milestones: [
          {
            name: 'Requirements Analysis',
            description: 'Complete analysis of system requirements',
            dueDate: new Date('2024-02-15'),
            status: 'completed',
            completedDate: new Date('2024-02-10')
          },
          {
            name: 'Development Phase 1',
            description: 'Core functionality development',
            dueDate: new Date('2024-04-15'),
            status: 'in-progress'
          }
        ],
        risks: [
          {
            title: 'Resource Availability',
            description: 'Key developers might be unavailable',
            severity: 'medium',
            probability: 'low',
            mitigation: 'Cross-train team members',
            status: 'identified',
            identifiedDate: new Date()
          }
        ],
        dependencies: [],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Employee Onboarding Portal',
        description: 'Digital portal for streamlined employee onboarding process',
        status: 'planning',
        priority: 'medium',
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-05-31'),
        budget: 80000,
        spentBudget: 0,
        progress: 0,
        autoCalculateProgress: true,
        manager: empMap['sarah.johnson@rayerp.com'],
        team: [empMap['alice.cooper@rayerp.com']],
        owner: userMap['sarah.johnson@rayerp.com'],
        members: [userMap['alice.cooper@rayerp.com']],
        departments: [deptMap['Human Resources'], deptMap['Information Technology']],
        client: 'Internal',
        tags: ['HR', 'Onboarding', 'Portal'],
        milestones: [
          {
            name: 'Design Phase',
            description: 'UI/UX design for the portal',
            dueDate: new Date('2024-03-01'),
            status: 'pending'
          }
        ],
        risks: [],
        dependencies: [],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Marketing Campaign Analytics',
        description: 'Advanced analytics dashboard for marketing campaigns',
        status: 'active',
        priority: 'medium',
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-04-15'),
        budget: 60000,
        spentBudget: 20000,
        progress: 40,
        autoCalculateProgress: true,
        manager: empMap['emily.davis@rayerp.com'],
        team: [empMap['carol.white@rayerp.com']],
        owner: userMap['emily.davis@rayerp.com'],
        members: [userMap['carol.white@rayerp.com']],
        departments: [deptMap['Marketing']],
        client: 'Internal',
        tags: ['Marketing', 'Analytics', 'Dashboard'],
        milestones: [
          {
            name: 'Data Collection Setup',
            description: 'Set up data collection mechanisms',
            dueDate: new Date('2024-02-28'),
            status: 'completed',
            completedDate: new Date('2024-02-25')
          }
        ],
        risks: [],
        dependencies: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
    console.log('✅ Created projects');

    // Get project IDs
    const projMap = {};
    const projsData = await db.collection('projects').find({}).toArray();
    projsData.forEach(proj => projMap[proj.name] = proj._id);

    // 6. Create Tasks
    console.log('\n📋 Creating tasks...');
    const tasks = await db.collection('tasks').insertMany([
      {
        title: 'Database Schema Design',
        description: 'Design and implement new database schema for enhanced features',
        status: 'in-progress',
        priority: 'high',
        project: projMap['ERP System Enhancement'],
        assignedTo: empMap['alice.cooper@rayerp.com'],
        assignedBy: empMap['john.smith@rayerp.com'],
        dueDate: new Date('2024-03-15'),
        estimatedHours: 40,
        actualHours: 15,
        tags: ['Database', 'Schema', 'Design'],
        comments: [
          {
            user: empMap['john.smith@rayerp.com'],
            comment: 'Please focus on scalability aspects',
            createdAt: new Date()
          }
        ],
        dependencies: [],
        subtasks: [],
        isRecurring: false,
        watchers: [empMap['john.smith@rayerp.com']],
        isTemplate: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: 'API Development',
        description: 'Develop REST APIs for new ERP features',
        status: 'todo',
        priority: 'high',
        project: projMap['ERP System Enhancement'],
        assignedTo: empMap['bob.martinez@rayerp.com'],
        assignedBy: empMap['john.smith@rayerp.com'],
        dueDate: new Date('2024-04-01'),
        estimatedHours: 60,
        actualHours: 0,
        tags: ['API', 'Development', 'Backend'],
        comments: [],
        dependencies: [],
        subtasks: [],
        isRecurring: false,
        watchers: [empMap['john.smith@rayerp.com']],
        isTemplate: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: 'Onboarding Workflow Design',
        description: 'Design the complete onboarding workflow for new employees',
        status: 'todo',
        priority: 'medium',
        project: projMap['Employee Onboarding Portal'],
        assignedTo: empMap['sarah.johnson@rayerp.com'],
        assignedBy: empMap['sarah.johnson@rayerp.com'],
        dueDate: new Date('2024-02-28'),
        estimatedHours: 20,
        actualHours: 0,
        tags: ['Workflow', 'Design', 'HR'],
        comments: [],
        dependencies: [],
        subtasks: [],
        isRecurring: false,
        watchers: [],
        isTemplate: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: 'Campaign Data Integration',
        description: 'Integrate various marketing campaign data sources',
        status: 'completed',
        priority: 'medium',
        project: projMap['Marketing Campaign Analytics'],
        assignedTo: empMap['carol.white@rayerp.com'],
        assignedBy: empMap['emily.davis@rayerp.com'],
        dueDate: new Date('2024-02-20'),
        estimatedHours: 30,
        actualHours: 28,
        tags: ['Integration', 'Data', 'Marketing'],
        comments: [
          {
            user: empMap['emily.davis@rayerp.com'],
            comment: 'Great work on the integration!',
            createdAt: new Date()
          }
        ],
        dependencies: [],
        subtasks: [],
        isRecurring: false,
        watchers: [empMap['emily.davis@rayerp.com']],
        isTemplate: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
    console.log('✅ Created tasks');

    // 7. Create Contacts
    console.log('\n📞 Creating contacts...');
    const contacts = await db.collection('contacts').insertMany([
      {
        name: 'TechCorp Solutions',
        email: 'contact@techcorp.com',
        phone: '+1-555-1001',
        company: 'TechCorp Solutions',
        position: 'Account Manager',
        address: {
          street: '100 Tech Plaza',
          city: 'San Francisco',
          state: 'CA',
          zipCode: '94105',
          country: 'USA'
        },
        category: 'Vendor',
        notes: 'Primary software vendor for development tools',
        tags: ['Vendor', 'Software', 'Development'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Global Marketing Inc',
        email: 'info@globalmarketing.com',
        phone: '+1-555-1002',
        company: 'Global Marketing Inc',
        position: 'Partnership Manager',
        address: {
          street: '200 Marketing Ave',
          city: 'Chicago',
          state: 'IL',
          zipCode: '60601',
          country: 'USA'
        },
        category: 'Partner',
        notes: 'Marketing partnership for campaign management',
        tags: ['Partner', 'Marketing', 'Campaigns'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Enterprise Client Corp',
        email: 'procurement@enterpriseclient.com',
        phone: '+1-555-1003',
        company: 'Enterprise Client Corp',
        position: 'Procurement Director',
        address: {
          street: '300 Business Blvd',
          city: 'Dallas',
          state: 'TX',
          zipCode: '75201',
          country: 'USA'
        },
        category: 'Client',
        notes: 'Major enterprise client for ERP solutions',
        tags: ['Client', 'Enterprise', 'ERP'],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
    console.log('✅ Created contacts');

    // 8. Create Department Budgets
    console.log('\n💰 Creating department budgets...');
    const currentYear = new Date().getFullYear();
    const budgets = await db.collection('departmentbudgets').insertMany([
      {
        department: deptMap['Information Technology'],
        fiscalYear: currentYear,
        totalBudget: 500000,
        categories: [
          { name: 'Software Licenses', budgetAmount: 150000, spentAmount: 45000 },
          { name: 'Hardware', budgetAmount: 200000, spentAmount: 80000 },
          { name: 'Training', budgetAmount: 50000, spentAmount: 15000 },
          { name: 'Consulting', budgetAmount: 100000, spentAmount: 25000 }
        ],
        status: 'approved',
        approvedBy: userMap['root@rayerp.com'],
        approvedAt: new Date(),
        createdBy: userMap['john.smith@rayerp.com'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        department: deptMap['Human Resources'],
        fiscalYear: currentYear,
        totalBudget: 300000,
        categories: [
          { name: 'Recruitment', budgetAmount: 100000, spentAmount: 30000 },
          { name: 'Training & Development', budgetAmount: 80000, spentAmount: 20000 },
          { name: 'Employee Benefits', budgetAmount: 120000, spentAmount: 40000 }
        ],
        status: 'approved',
        approvedBy: userMap['root@rayerp.com'],
        approvedAt: new Date(),
        createdBy: userMap['sarah.johnson@rayerp.com'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        department: deptMap['Marketing'],
        fiscalYear: currentYear,
        totalBudget: 400000,
        categories: [
          { name: 'Digital Advertising', budgetAmount: 200000, spentAmount: 75000 },
          { name: 'Content Creation', budgetAmount: 100000, spentAmount: 35000 },
          { name: 'Events & Conferences', budgetAmount: 100000, spentAmount: 20000 }
        ],
        status: 'approved',
        approvedBy: userMap['root@rayerp.com'],
        approvedAt: new Date(),
        createdBy: userMap['emily.davis@rayerp.com'],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
    console.log('✅ Created department budgets');

    // Update department employee counts
    console.log('\n🔄 Updating department employee counts...');
    for (const dept of deptsData) {
      const count = await db.collection('employees').countDocuments({ department: dept.name });
      await db.collection('departments').updateOne(
        { _id: dept._id },
        { $set: { employeeCount: count } }
      );
    }
    console.log('✅ Updated department employee counts');

    console.log('\n🎉 ERP System populated successfully!');
    console.log('\n📊 Summary:');
    console.log(`   • ${rolesData.length} Roles created`);
    console.log(`   • ${deptsData.length} Departments created`);
    console.log(`   • ${usersData.length} Users created`);
    console.log(`   • ${empsData.length} Employees created`);
    console.log(`   • ${projsData.length} Projects created`);
    console.log(`   • 4 Tasks created`);
    console.log(`   • 3 Contacts created`);
    console.log(`   • 3 Department Budgets created`);
    
    console.log('\n🔑 Login Credentials:');
    console.log('   Root Admin: root@rayerp.com / password123');
    console.log('   IT Director: john.smith@rayerp.com / password123');
    console.log('   HR Manager: sarah.johnson@rayerp.com / password123');
    console.log('   All users: password123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

populateERP();