// Sync all budgets with projects
const mongoose = require('mongoose');
require('dotenv').config();

const budgetSchema = new mongoose.Schema({}, { strict: false });
const projectSchema = new mongoose.Schema({}, { strict: false });

const Budget = mongoose.model('Budget', budgetSchema);
const Project = mongoose.model('Project', projectSchema);

async function syncBudgets() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/erp-system');
    console.log('Connected to MongoDB');

    const budgets = await Budget.find({ budgetType: 'project' });
    console.log(`Found ${budgets.length} project budgets to sync`);

    let syncedCount = 0;
    for (const budget of budgets) {
      if (budget.projectId && mongoose.Types.ObjectId.isValid(budget.projectId.toString())) {
        const totalSpent = budget.categories?.reduce((sum, cat) => sum + (cat.spentAmount || 0), 0) || 0;
        
        const result = await Project.findByIdAndUpdate(
          budget.projectId,
          {
            budget: budget.totalBudget,
            spentBudget: totalSpent
          },
          { new: true }
        );

        if (result) {
          console.log(`✓ Synced budget ${budget._id} to project ${result.name}`);
          console.log(`  Budget: ${budget.totalBudget}, Spent: ${totalSpent}`);
          syncedCount++;
        }
      }
    }

    console.log(`\n✅ Successfully synced ${syncedCount} budgets`);

    // Show updated projects
    const projects = await Project.find().select('name budget spentBudget');
    console.log('\n--- Updated Projects ---');
    projects.forEach(p => {
      console.log(`${p.name}: Budget=${p.budget}, Spent=${p.spentBudget}`);
    });

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

syncBudgets();
