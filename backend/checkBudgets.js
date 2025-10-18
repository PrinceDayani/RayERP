// Quick script to check budgets in database
const mongoose = require('mongoose');
require('dotenv').config();

const budgetSchema = new mongoose.Schema({}, { strict: false });
const projectSchema = new mongoose.Schema({}, { strict: false });

const Budget = mongoose.model('Budget', budgetSchema);
const Project = mongoose.model('Project', projectSchema);

async function checkBudgets() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/erp-system');
    console.log('Connected to MongoDB');

    const budgets = await Budget.find().lean();
    const projects = await Project.find().select('_id name budget spentBudget').lean();

    console.log('\n=== BUDGET CHECK ===');
    console.log(`Total Budgets: ${budgets.length}`);
    console.log(`Total Projects: ${projects.length}`);

    if (budgets.length > 0) {
      console.log('\n--- Budgets ---');
      budgets.forEach((b, i) => {
        console.log(`${i + 1}. Budget ID: ${b._id}`);
        console.log(`   Project ID: ${b.projectId}`);
        console.log(`   Project Name: ${b.projectName}`);
        console.log(`   Total: ${b.totalBudget} ${b.currency}`);
        console.log(`   Status: ${b.status}`);
        console.log('');
      });
    } else {
      console.log('\n❌ No budgets found in database');
    }

    if (projects.length > 0) {
      console.log('\n--- Projects ---');
      projects.forEach((p, i) => {
        console.log(`${i + 1}. ${p.name} (${p._id})`);
        console.log(`   Budget: ${p.budget || 0}`);
        console.log(`   Spent: ${p.spentBudget || 0}`);
        console.log('');
      });
    }

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkBudgets();
