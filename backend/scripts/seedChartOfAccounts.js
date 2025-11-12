const mongoose = require('mongoose');
require('dotenv').config();

const accountSchema = new mongoose.Schema({
  code: String,
  name: String,
  type: String,
  subType: String,
  category: String,
  level: Number,
  balance: Number,
  openingBalance: Number,
  isActive: Boolean,
  isGroup: Boolean,
  parentId: mongoose.Schema.Types.ObjectId,
  description: String,
  createdBy: mongoose.Schema.Types.ObjectId
}, { timestamps: true });

const Account = mongoose.model('Account', accountSchema);

const chartOfAccounts = [
  // ASSETS
  { code: '1000', name: 'Assets', type: 'asset', isGroup: true, level: 0, description: 'All company assets' },
  { code: '1100', name: 'Current Assets', type: 'asset', isGroup: true, level: 1, parent: '1000', category: 'Current' },
  { code: '1110', name: 'Cash and Bank', type: 'asset', isGroup: true, level: 2, parent: '1100', category: 'Liquid' },
  { code: '1111', name: 'Cash in Hand', type: 'asset', level: 3, parent: '1110', openingBalance: 50000 },
  { code: '1112', name: 'Petty Cash', type: 'asset', level: 3, parent: '1110', openingBalance: 5000 },
  { code: '1120', name: 'Bank Accounts', type: 'asset', isGroup: true, level: 2, parent: '1100' },
  { code: '1121', name: 'HDFC Bank - Current', type: 'asset', level: 3, parent: '1120', openingBalance: 500000 },
  { code: '1122', name: 'ICICI Bank - Savings', type: 'asset', level: 3, parent: '1120', openingBalance: 250000 },
  { code: '1130', name: 'Accounts Receivable', type: 'asset', isGroup: true, level: 2, parent: '1100' },
  { code: '1131', name: 'Trade Debtors', type: 'asset', level: 3, parent: '1130', openingBalance: 150000 },
  { code: '1132', name: 'Other Receivables', type: 'asset', level: 3, parent: '1130', openingBalance: 25000 },
  { code: '1140', name: 'Inventory', type: 'asset', isGroup: true, level: 2, parent: '1100' },
  { code: '1141', name: 'Raw Materials', type: 'asset', level: 3, parent: '1140', openingBalance: 100000 },
  { code: '1142', name: 'Finished Goods', type: 'asset', level: 3, parent: '1140', openingBalance: 200000 },
  
  { code: '1200', name: 'Fixed Assets', type: 'asset', isGroup: true, level: 1, parent: '1000', category: 'Non-Current' },
  { code: '1210', name: 'Property', type: 'asset', isGroup: true, level: 2, parent: '1200' },
  { code: '1211', name: 'Land', type: 'asset', level: 3, parent: '1210', openingBalance: 5000000 },
  { code: '1212', name: 'Buildings', type: 'asset', level: 3, parent: '1210', openingBalance: 3000000 },
  { code: '1220', name: 'Equipment', type: 'asset', isGroup: true, level: 2, parent: '1200' },
  { code: '1221', name: 'Office Equipment', type: 'asset', level: 3, parent: '1220', openingBalance: 150000 },
  { code: '1222', name: 'Computer Equipment', type: 'asset', level: 3, parent: '1220', openingBalance: 200000 },
  { code: '1223', name: 'Furniture & Fixtures', type: 'asset', level: 3, parent: '1220', openingBalance: 100000 },
  { code: '1230', name: 'Vehicles', type: 'asset', level: 2, parent: '1200', openingBalance: 800000 },

  // LIABILITIES
  { code: '2000', name: 'Liabilities', type: 'liability', isGroup: true, level: 0, description: 'All company liabilities' },
  { code: '2100', name: 'Current Liabilities', type: 'liability', isGroup: true, level: 1, parent: '2000', category: 'Current' },
  { code: '2110', name: 'Accounts Payable', type: 'liability', isGroup: true, level: 2, parent: '2100' },
  { code: '2111', name: 'Trade Creditors', type: 'liability', level: 3, parent: '2110', openingBalance: 100000 },
  { code: '2112', name: 'Other Payables', type: 'liability', level: 3, parent: '2110', openingBalance: 25000 },
  { code: '2120', name: 'Short Term Loans', type: 'liability', level: 2, parent: '2100', openingBalance: 200000 },
  { code: '2130', name: 'Tax Payable', type: 'liability', isGroup: true, level: 2, parent: '2100' },
  { code: '2131', name: 'GST Payable', type: 'liability', level: 3, parent: '2130', openingBalance: 50000 },
  { code: '2132', name: 'TDS Payable', type: 'liability', level: 3, parent: '2130', openingBalance: 15000 },
  { code: '2133', name: 'Income Tax Payable', type: 'liability', level: 3, parent: '2130', openingBalance: 75000 },
  
  { code: '2200', name: 'Long Term Liabilities', type: 'liability', isGroup: true, level: 1, parent: '2000', category: 'Non-Current' },
  { code: '2210', name: 'Long Term Loans', type: 'liability', level: 2, parent: '2200', openingBalance: 1000000 },
  { code: '2220', name: 'Mortgage Payable', type: 'liability', level: 2, parent: '2200', openingBalance: 2000000 },

  // EQUITY
  { code: '3000', name: 'Equity', type: 'equity', isGroup: true, level: 0, description: 'Owner\'s equity' },
  { code: '3100', name: 'Capital', type: 'equity', level: 1, parent: '3000', openingBalance: 5000000 },
  { code: '3200', name: 'Retained Earnings', type: 'equity', level: 1, parent: '3000', openingBalance: 500000 },
  { code: '3300', name: 'Current Year Earnings', type: 'equity', level: 1, parent: '3000', openingBalance: 0 },

  // REVENUE
  { code: '4000', name: 'Revenue', type: 'revenue', isGroup: true, level: 0, description: 'All income sources' },
  { code: '4100', name: 'Sales Revenue', type: 'revenue', isGroup: true, level: 1, parent: '4000' },
  { code: '4110', name: 'Product Sales', type: 'revenue', level: 2, parent: '4100' },
  { code: '4120', name: 'Service Revenue', type: 'revenue', level: 2, parent: '4100' },
  { code: '4200', name: 'Other Income', type: 'revenue', isGroup: true, level: 1, parent: '4000' },
  { code: '4210', name: 'Interest Income', type: 'revenue', level: 2, parent: '4200' },
  { code: '4220', name: 'Rental Income', type: 'revenue', level: 2, parent: '4200' },
  { code: '4230', name: 'Miscellaneous Income', type: 'revenue', level: 2, parent: '4200' },

  // EXPENSES
  { code: '5000', name: 'Expenses', type: 'expense', isGroup: true, level: 0, description: 'All company expenses' },
  { code: '5100', name: 'Cost of Goods Sold', type: 'expense', isGroup: true, level: 1, parent: '5000', category: 'Direct' },
  { code: '5110', name: 'Purchase of Materials', type: 'expense', level: 2, parent: '5100' },
  { code: '5120', name: 'Direct Labor', type: 'expense', level: 2, parent: '5100' },
  { code: '5130', name: 'Manufacturing Overhead', type: 'expense', level: 2, parent: '5100' },
  
  { code: '5200', name: 'Operating Expenses', type: 'expense', isGroup: true, level: 1, parent: '5000', category: 'Indirect' },
  { code: '5210', name: 'Salaries & Wages', type: 'expense', isGroup: true, level: 2, parent: '5200' },
  { code: '5211', name: 'Employee Salaries', type: 'expense', level: 3, parent: '5210' },
  { code: '5212', name: 'Bonus & Incentives', type: 'expense', level: 3, parent: '5210' },
  { code: '5220', name: 'Rent Expense', type: 'expense', level: 2, parent: '5200' },
  { code: '5230', name: 'Utilities', type: 'expense', isGroup: true, level: 2, parent: '5200' },
  { code: '5231', name: 'Electricity', type: 'expense', level: 3, parent: '5230' },
  { code: '5232', name: 'Water', type: 'expense', level: 3, parent: '5230' },
  { code: '5233', name: 'Internet & Phone', type: 'expense', level: 3, parent: '5230' },
  { code: '5240', name: 'Office Supplies', type: 'expense', level: 2, parent: '5200' },
  { code: '5250', name: 'Marketing & Advertising', type: 'expense', level: 2, parent: '5200' },
  { code: '5260', name: 'Travel & Conveyance', type: 'expense', level: 2, parent: '5200' },
  { code: '5270', name: 'Professional Fees', type: 'expense', level: 2, parent: '5200' },
  { code: '5280', name: 'Insurance', type: 'expense', level: 2, parent: '5200' },
  { code: '5290', name: 'Depreciation', type: 'expense', level: 2, parent: '5200' },
  
  { code: '5300', name: 'Financial Expenses', type: 'expense', isGroup: true, level: 1, parent: '5000' },
  { code: '5310', name: 'Interest Expense', type: 'expense', level: 2, parent: '5300' },
  { code: '5320', name: 'Bank Charges', type: 'expense', level: 2, parent: '5300' },
  
  { code: '5400', name: 'Tax Expenses', type: 'expense', isGroup: true, level: 1, parent: '5000' },
  { code: '5410', name: 'Income Tax', type: 'expense', level: 2, parent: '5400' },
  { code: '5420', name: 'Other Taxes', type: 'expense', level: 2, parent: '5400' }
];

async function seedChartOfAccounts() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/erp-system');
    console.log('Connected to MongoDB');

    await Account.deleteMany({});
    console.log('Cleared existing accounts');

    const accountMap = new Map();
    const defaultUserId = new mongoose.Types.ObjectId();

    for (const acc of chartOfAccounts) {
      let parentId = null;
      if (acc.parent) {
        parentId = accountMap.get(acc.parent);
      }

      const account = await Account.create({
        code: acc.code,
        name: acc.name,
        type: acc.type,
        subType: acc.subType || '',
        category: acc.category || '',
        level: acc.level,
        balance: acc.openingBalance || 0,
        openingBalance: acc.openingBalance || 0,
        isActive: true,
        isGroup: acc.isGroup || false,
        parentId: parentId,
        description: acc.description || '',
        createdBy: defaultUserId
      });

      accountMap.set(acc.code, account._id);
      console.log(`Created: ${acc.code} - ${acc.name}`);
    }

    console.log(`\n✅ Successfully seeded ${chartOfAccounts.length} accounts`);
    
    const summary = {
      assets: await Account.countDocuments({ type: 'asset' }),
      liabilities: await Account.countDocuments({ type: 'liability' }),
      equity: await Account.countDocuments({ type: 'equity' }),
      revenue: await Account.countDocuments({ type: 'revenue' }),
      expenses: await Account.countDocuments({ type: 'expense' })
    };

    console.log('\n📊 Summary:');
    console.log(`   Assets: ${summary.assets}`);
    console.log(`   Liabilities: ${summary.liabilities}`);
    console.log(`   Equity: ${summary.equity}`);
    console.log(`   Revenue: ${summary.revenue}`);
    console.log(`   Expenses: ${summary.expenses}`);

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error seeding chart of accounts:', error);
    process.exit(1);
  }
}

seedChartOfAccounts();
