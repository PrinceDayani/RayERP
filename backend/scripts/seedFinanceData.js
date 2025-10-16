const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Account = require('../src/models/Account').default;
const User = require('../src/models/User').default;

const seedFinanceData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Find admin user
    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      console.log('No admin user found. Please create an admin user first.');
      return;
    }

    // Clear existing accounts
    await Account.deleteMany({});
    console.log('Cleared existing accounts');

    // Create chart of accounts
    const accounts = [
      // Assets
      { code: '1000', name: 'Cash', type: 'asset', subType: 'current_asset' },
      { code: '1100', name: 'Accounts Receivable', type: 'asset', subType: 'current_asset' },
      { code: '1200', name: 'Inventory', type: 'asset', subType: 'current_asset' },
      { code: '1500', name: 'Equipment', type: 'asset', subType: 'fixed_asset' },
      { code: '1600', name: 'Accumulated Depreciation', type: 'asset', subType: 'fixed_asset' },
      
      // Liabilities
      { code: '2000', name: 'Accounts Payable', type: 'liability', subType: 'current_liability' },
      { code: '2100', name: 'Accrued Expenses', type: 'liability', subType: 'current_liability' },
      { code: '2500', name: 'Long-term Debt', type: 'liability', subType: 'long_term_liability' },
      
      // Equity
      { code: '3000', name: 'Owner\'s Equity', type: 'equity', subType: 'capital' },
      { code: '3100', name: 'Retained Earnings', type: 'equity', subType: 'retained_earnings' },
      
      // Revenue
      { code: '4000', name: 'Sales Revenue', type: 'revenue', subType: 'operating_revenue' },
      { code: '4100', name: 'Service Revenue', type: 'revenue', subType: 'operating_revenue' },
      { code: '4900', name: 'Other Income', type: 'revenue', subType: 'non_operating_revenue' },
      
      // Expenses
      { code: '5000', name: 'Cost of Goods Sold', type: 'expense', subType: 'cost_of_sales' },
      { code: '6000', name: 'Salaries Expense', type: 'expense', subType: 'operating_expense' },
      { code: '6100', name: 'Rent Expense', type: 'expense', subType: 'operating_expense' },
      { code: '6200', name: 'Utilities Expense', type: 'expense', subType: 'operating_expense' },
      { code: '6300', name: 'Office Supplies', type: 'expense', subType: 'operating_expense' },
      { code: '6400', name: 'Marketing Expense', type: 'expense', subType: 'operating_expense' },
      { code: '6500', name: 'Travel Expense', type: 'expense', subType: 'operating_expense' },
      { code: '6900', name: 'Miscellaneous Expense', type: 'expense', subType: 'operating_expense' }
    ];

    // Get all projects to create accounts for each
    const Project = require('../src/models/Project').default;
    const projects = await Project.find({ status: 'active' });
    
    if (projects.length === 0) {
      console.log('No active projects found. Creating global accounts only.');
      // Create global accounts (no projectId)
      for (const accountData of accounts) {
        await Account.create({
          ...accountData,
          createdBy: adminUser._id,
          balance: 0,
          isActive: true
        });
      }
    } else {
      // Create accounts for each project
      for (const project of projects) {
        for (const accountData of accounts) {
          await Account.create({
            ...accountData,
            code: `${project._id.toString().slice(-4)}-${accountData.code}`,
            projectId: project._id,
            createdBy: adminUser._id,
            balance: 0,
            isActive: true
          });
        }
      }
    }

    console.log(`Created ${accounts.length} accounts successfully`);
    console.log('Finance data seeding completed!');
    
  } catch (error) {
    console.error('Error seeding finance data:', error);
  } finally {
    await mongoose.disconnect();
  }
};

seedFinanceData();