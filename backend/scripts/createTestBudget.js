const mongoose = require('mongoose');
require('dotenv').config();

const budgetSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  projectName: String,
  fiscalYear: Number,
  fiscalPeriod: String,
  totalBudget: Number,
  actualSpent: { type: Number, default: 0 },
  remainingBudget: { type: Number, default: 0 },
  utilizationPercentage: { type: Number, default: 0 },
  currency: String,
  status: String,
  categories: Array,
  approvals: Array,
  budgetType: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: Date,
  updatedAt: Date
});

const Budget = mongoose.model('Budget', budgetSchema);
const User = mongoose.model('User', new mongoose.Schema({}));
const Project = mongoose.model('Project', new mongoose.Schema({}));

async function createTestBudget() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const user = await User.findOne();
    const project = await Project.findOne();

    if (!user || !project) {
      console.log('No user or project found. Please create them first.');
      process.exit(1);
    }

    const testBudget = new Budget({
      projectId: project._id,
      projectName: project.name || 'Test Project',
      fiscalYear: 2024,
      fiscalPeriod: 'Q1',
      totalBudget: 100000,
      actualSpent: 0,
      remainingBudget: 100000,
      utilizationPercentage: 0,
      currency: 'INR',
      status: 'pending',
      categories: [
        {
          name: 'Labor',
          type: 'labor',
          allocatedAmount: 50000,
          spentAmount: 0,
          items: []
        },
        {
          name: 'Materials',
          type: 'materials',
          allocatedAmount: 50000,
          spentAmount: 0,
          items: []
        }
      ],
      approvals: [],
      budgetType: 'project',
      createdBy: user._id,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await testBudget.save();
    console.log('Test budget created successfully:', testBudget._id);
    console.log('Status:', testBudget.status);

    const pendingBudgets = await Budget.find({ status: 'pending' });
    console.log(`Total pending budgets: ${pendingBudgets.length}`);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createTestBudget();
