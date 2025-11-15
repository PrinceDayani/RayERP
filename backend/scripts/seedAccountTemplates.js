const mongoose = require('mongoose');
require('dotenv').config();

const AccountTemplateSchema = new mongoose.Schema({
  name: String,
  industry: String,
  description: String,
  accounts: [{
    code: String,
    name: String,
    type: String,
    parentCode: String,
    isGroup: Boolean,
    level: Number
  }],
  isActive: Boolean
}, { timestamps: true });

const AccountTemplate = mongoose.model('AccountTemplate', AccountTemplateSchema);

const templates = [
  {
    name: 'Manufacturing Company',
    industry: 'manufacturing',
    description: 'Standard chart of accounts for manufacturing businesses',
    isActive: true,
    accounts: [
      // Assets
      { code: '1000', name: 'Assets', type: 'asset', isGroup: true, level: 0 },
      { code: '1100', name: 'Current Assets', type: 'asset', parentCode: '1000', isGroup: true, level: 1 },
      { code: '1110', name: 'Cash and Bank', type: 'asset', parentCode: '1100', isGroup: false, level: 2 },
      { code: '1120', name: 'Accounts Receivable', type: 'asset', parentCode: '1100', isGroup: false, level: 2 },
      { code: '1130', name: 'Inventory - Raw Materials', type: 'asset', parentCode: '1100', isGroup: false, level: 2 },
      { code: '1131', name: 'Inventory - Work in Progress', type: 'asset', parentCode: '1100', isGroup: false, level: 2 },
      { code: '1132', name: 'Inventory - Finished Goods', type: 'asset', parentCode: '1100', isGroup: false, level: 2 },
      { code: '1200', name: 'Fixed Assets', type: 'asset', parentCode: '1000', isGroup: true, level: 1 },
      { code: '1210', name: 'Plant and Machinery', type: 'asset', parentCode: '1200', isGroup: false, level: 2 },
      { code: '1220', name: 'Buildings', type: 'asset', parentCode: '1200', isGroup: false, level: 2 },
      { code: '1230', name: 'Vehicles', type: 'asset', parentCode: '1200', isGroup: false, level: 2 },
      
      // Liabilities
      { code: '2000', name: 'Liabilities', type: 'liability', isGroup: true, level: 0 },
      { code: '2100', name: 'Current Liabilities', type: 'liability', parentCode: '2000', isGroup: true, level: 1 },
      { code: '2110', name: 'Accounts Payable', type: 'liability', parentCode: '2100', isGroup: false, level: 2 },
      { code: '2120', name: 'Short Term Loans', type: 'liability', parentCode: '2100', isGroup: false, level: 2 },
      { code: '2200', name: 'Long Term Liabilities', type: 'liability', parentCode: '2000', isGroup: true, level: 1 },
      { code: '2210', name: 'Long Term Loans', type: 'liability', parentCode: '2200', isGroup: false, level: 2 },
      
      // Revenue
      { code: '4000', name: 'Revenue', type: 'revenue', isGroup: true, level: 0 },
      { code: '4100', name: 'Sales Revenue', type: 'revenue', parentCode: '4000', isGroup: false, level: 1 },
      { code: '4200', name: 'Other Income', type: 'revenue', parentCode: '4000', isGroup: false, level: 1 },
      
      // Expenses
      { code: '5000', name: 'Cost of Goods Sold', type: 'expense', isGroup: true, level: 0 },
      { code: '5100', name: 'Direct Materials', type: 'expense', parentCode: '5000', isGroup: false, level: 1 },
      { code: '5200', name: 'Direct Labor', type: 'expense', parentCode: '5000', isGroup: false, level: 1 },
      { code: '5300', name: 'Manufacturing Overhead', type: 'expense', parentCode: '5000', isGroup: false, level: 1 },
      { code: '6000', name: 'Operating Expenses', type: 'expense', isGroup: true, level: 0 },
      { code: '6100', name: 'Salaries and Wages', type: 'expense', parentCode: '6000', isGroup: false, level: 1 },
      { code: '6200', name: 'Rent', type: 'expense', parentCode: '6000', isGroup: false, level: 1 },
      { code: '6300', name: 'Utilities', type: 'expense', parentCode: '6000', isGroup: false, level: 1 },
      { code: '6400', name: 'Marketing and Advertising', type: 'expense', parentCode: '6000', isGroup: false, level: 1 }
    ]
  },
  {
    name: 'Retail Business',
    industry: 'retail',
    description: 'Chart of accounts for retail and e-commerce businesses',
    isActive: true,
    accounts: [
      // Assets
      { code: '1000', name: 'Assets', type: 'asset', isGroup: true, level: 0 },
      { code: '1100', name: 'Current Assets', type: 'asset', parentCode: '1000', isGroup: true, level: 1 },
      { code: '1110', name: 'Cash', type: 'asset', parentCode: '1100', isGroup: false, level: 2 },
      { code: '1120', name: 'Bank Accounts', type: 'asset', parentCode: '1100', isGroup: false, level: 2 },
      { code: '1130', name: 'Payment Gateway', type: 'asset', parentCode: '1100', isGroup: false, level: 2 },
      { code: '1140', name: 'Inventory', type: 'asset', parentCode: '1100', isGroup: false, level: 2 },
      { code: '1200', name: 'Fixed Assets', type: 'asset', parentCode: '1000', isGroup: true, level: 1 },
      { code: '1210', name: 'Store Equipment', type: 'asset', parentCode: '1200', isGroup: false, level: 2 },
      { code: '1220', name: 'Furniture and Fixtures', type: 'asset', parentCode: '1200', isGroup: false, level: 2 },
      
      // Liabilities
      { code: '2000', name: 'Liabilities', type: 'liability', isGroup: true, level: 0 },
      { code: '2100', name: 'Accounts Payable', type: 'liability', parentCode: '2000', isGroup: false, level: 1 },
      { code: '2200', name: 'Credit Card Payable', type: 'liability', parentCode: '2000', isGroup: false, level: 1 },
      
      // Revenue
      { code: '4000', name: 'Revenue', type: 'revenue', isGroup: true, level: 0 },
      { code: '4100', name: 'Product Sales', type: 'revenue', parentCode: '4000', isGroup: false, level: 1 },
      { code: '4200', name: 'Online Sales', type: 'revenue', parentCode: '4000', isGroup: false, level: 1 },
      { code: '4300', name: 'Shipping Revenue', type: 'revenue', parentCode: '4000', isGroup: false, level: 1 },
      
      // Expenses
      { code: '5000', name: 'Cost of Goods Sold', type: 'expense', isGroup: true, level: 0 },
      { code: '5100', name: 'Purchase of Goods', type: 'expense', parentCode: '5000', isGroup: false, level: 1 },
      { code: '5200', name: 'Freight Inward', type: 'expense', parentCode: '5000', isGroup: false, level: 1 },
      { code: '6000', name: 'Operating Expenses', type: 'expense', isGroup: true, level: 0 },
      { code: '6100', name: 'Store Rent', type: 'expense', parentCode: '6000', isGroup: false, level: 1 },
      { code: '6200', name: 'Staff Salaries', type: 'expense', parentCode: '6000', isGroup: false, level: 1 },
      { code: '6300', name: 'Marketing', type: 'expense', parentCode: '6000', isGroup: false, level: 1 },
      { code: '6400', name: 'Payment Gateway Fees', type: 'expense', parentCode: '6000', isGroup: false, level: 1 },
      { code: '6500', name: 'Shipping Expenses', type: 'expense', parentCode: '6000', isGroup: false, level: 1 }
    ]
  },
  {
    name: 'Service Company',
    industry: 'services',
    description: 'Chart of accounts for service-based businesses',
    isActive: true,
    accounts: [
      // Assets
      { code: '1000', name: 'Assets', type: 'asset', isGroup: true, level: 0 },
      { code: '1100', name: 'Current Assets', type: 'asset', parentCode: '1000', isGroup: true, level: 1 },
      { code: '1110', name: 'Cash and Bank', type: 'asset', parentCode: '1100', isGroup: false, level: 2 },
      { code: '1120', name: 'Accounts Receivable', type: 'asset', parentCode: '1100', isGroup: false, level: 2 },
      { code: '1130', name: 'Unbilled Revenue', type: 'asset', parentCode: '1100', isGroup: false, level: 2 },
      { code: '1200', name: 'Fixed Assets', type: 'asset', parentCode: '1000', isGroup: true, level: 1 },
      { code: '1210', name: 'Office Equipment', type: 'asset', parentCode: '1200', isGroup: false, level: 2 },
      { code: '1220', name: 'Computer Equipment', type: 'asset', parentCode: '1200', isGroup: false, level: 2 },
      
      // Liabilities
      { code: '2000', name: 'Liabilities', type: 'liability', isGroup: true, level: 0 },
      { code: '2100', name: 'Accounts Payable', type: 'liability', parentCode: '2000', isGroup: false, level: 1 },
      { code: '2200', name: 'Deferred Revenue', type: 'liability', parentCode: '2000', isGroup: false, level: 1 },
      
      // Revenue
      { code: '4000', name: 'Revenue', type: 'revenue', isGroup: true, level: 0 },
      { code: '4100', name: 'Service Revenue', type: 'revenue', parentCode: '4000', isGroup: false, level: 1 },
      { code: '4200', name: 'Consulting Revenue', type: 'revenue', parentCode: '4000', isGroup: false, level: 1 },
      { code: '4300', name: 'Subscription Revenue', type: 'revenue', parentCode: '4000', isGroup: false, level: 1 },
      
      // Expenses
      { code: '6000', name: 'Operating Expenses', type: 'expense', isGroup: true, level: 0 },
      { code: '6100', name: 'Salaries and Wages', type: 'expense', parentCode: '6000', isGroup: false, level: 1 },
      { code: '6200', name: 'Office Rent', type: 'expense', parentCode: '6000', isGroup: false, level: 1 },
      { code: '6300', name: 'Professional Fees', type: 'expense', parentCode: '6000', isGroup: false, level: 1 },
      { code: '6400', name: 'Software Subscriptions', type: 'expense', parentCode: '6000', isGroup: false, level: 1 },
      { code: '6500', name: 'Travel and Entertainment', type: 'expense', parentCode: '6000', isGroup: false, level: 1 }
    ]
  }
];

async function seedTemplates() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/erp-system');
    console.log('Connected to MongoDB');

    await AccountTemplate.deleteMany({});
    console.log('Cleared existing templates');

    const result = await AccountTemplate.insertMany(templates);
    console.log(`✅ Seeded ${result.length} account templates`);

    templates.forEach(t => {
      console.log(`  - ${t.name} (${t.accounts.length} accounts)`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error seeding templates:', error);
    process.exit(1);
  }
}

seedTemplates();
