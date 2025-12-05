const mongoose = require('mongoose');
require('dotenv').config();

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  role: { type: mongoose.Schema.Types.ObjectId, ref: 'Role' }
});

const User = mongoose.model('User', userSchema);

const projectSchema = new mongoose.Schema({
  name: String,
  description: String,
  status: String,
  priority: String,
  startDate: Date,
  endDate: Date,
  budget: Number,
  spentBudget: { type: Number, default: 0 },
  progress: { type: Number, default: 0 },
  manager: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  team: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }],
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  departments: [String],
  milestones: [{ name: String, dueDate: Date, status: String }],
  risks: [{ description: String, severity: String, mitigation: String }],
  dependencies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Project' }],
  instructions: [{
    title: String,
    content: String,
    type: String,
    priority: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: Date,
    updatedAt: Date
  }]
}, { timestamps: true });

const Project = mongoose.model('Project', projectSchema, 'projects');

async function seedProjects() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const rootUser = await User.findOne({});
    const ownerId = rootUser ? rootUser._id : null;
    const members = ownerId ? [ownerId] : [];
    
    console.log(rootUser ? `Using user: ${rootUser.name}` : 'Creating without owner');

    const testProjects = [
      {
        name: 'ERP System Development',
        description: 'Complete ERP system with modules for HR, Finance, and Inventory',
        status: 'active',
        priority: 'high',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        budget: 500000,
        spentBudget: 150000,
        progress: 35,
        owner: ownerId,
        members: members,
        departments: ['IT', 'Development']
      },
      {
        name: 'Mobile App Development',
        description: 'Cross-platform mobile application',
        status: 'active',
        priority: 'medium',
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-08-31'),
        budget: 200000,
        spentBudget: 80000,
        progress: 50,
        owner: ownerId,
        members: members,
        departments: ['IT']
      },
      {
        name: 'Website Redesign',
        description: 'Complete redesign of company website',
        status: 'planning',
        priority: 'medium',
        startDate: new Date('2024-03-01'),
        endDate: new Date('2024-06-30'),
        budget: 100000,
        owner: ownerId,
        members: members,
        departments: ['Marketing']
      }
    ];

    await Project.deleteMany({});
    const createdProjects = await Project.insertMany(testProjects);
    console.log(`✅ Created ${createdProjects.length} test projects`);
    createdProjects.forEach(p => console.log(`  - ${p.name} (${p.status})`));
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

seedProjects();
