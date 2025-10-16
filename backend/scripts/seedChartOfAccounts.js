const mongoose = require('mongoose');
require('dotenv').config();

const AccountSchema = new mongoose.Schema({
  code: String,
  name: String,
  type: String,
  subType: String,
  balance: { type: Number, default: 0 },
  openingBalance: { type: Number, default: 0 },
  currency: { type: String, default: 'INR' },
  isActive: { type: Boolean, default: true },
  description: String
}, { timestamps: true });

const Account = mongoose.model('Account', AccountSchema);

const defaultAccounts = [
  // Assets
  { code: '1000', name: 'Cash', type: 'asset', subType: 'Current Asset', description: 'Cash on hand and in bank' },
  { code: '1100', name: 'Accounts Receivable', type: 'asset', subType: 'Current Asset', description: 'Money owed by customers' },
  { code: '1200', name: 'Inventory', type: 'asset', subType: 'Current Asset', description: 'Goods for sale' },
  { code: '1300', name: 'Prepaid Expenses', type: 'asset', subType: 'Current Asset', description: 'Expenses paid in advance' },
  { code: '1500', name: 'Equipment', type: 'asset', subType: 'Fixed Asset', description: 'Office and business equipment' },
  { code: '1600', name: 'Accumulated Depreciation - Equipment', type: 'asset', subType: 'Fixed Asset', description: 'Depreciation on equipment' },
  
  // Liabilities
  { code: '2000', name: 'Accounts Payable', type: 'liability', subType: 'Current Liability', description: 'Money owed to suppliers' },
  { code: '2100', name: 'Accrued Expenses', type: 'liability', subType: 'Current Liability', description: 'Expenses incurred but not paid' },
  { code: '2200', name: 'Short-term Loans', type: 'liability', subType: 'Current Liability', description: 'Loans due within one year' },
  { code: '2500', name: 'Long-term Debt', type: 'liability', subType: 'Long-term Liability', description: 'Loans due after one year' },
  
  // Equity
  { code: '3000', name: 'Owner\'s Equity', type: 'equity', subType: 'Capital', description: 'Owner\'s investment in business' },
  { code: '3100', name: 'Retained Earnings', type: 'equity', subType: 'Retained Earnings', description: 'Accumulated profits' },
  { code: '3200', name: 'Drawings', type: 'equity', subType: 'Drawings', description: 'Owner withdrawals' },
  
  // Revenue
  { code: '4000', name: 'Sales Revenue', type: 'revenue', subType: 'Operating Revenue', description: 'Revenue from sales' },
  { code: '4100', name: 'Service Revenue', type: 'revenue', subType: 'Operating Revenue', description: 'Revenue from services' },
  { code: '4200', name: 'Interest Income', type: 'revenue', subType: 'Non-operating Revenue', description: 'Interest earned' },
  
  // Expenses
  { code: '5000', name: 'Cost of Goods Sold', type: 'expense', subType: 'Direct Expense', description: 'Direct cost of products sold' },
  { code: '6000', name: 'Salaries Expense', type: 'expense', subType: 'Operating Expense', description: 'Employee salaries' },
  { code: '6100', name: 'Rent Expense', type: 'expense', subType: 'Operating Expense', description: 'Office rent' },
  { code: '6200', name: 'Utilities Expense', type: 'expense', subType: 'Operating Expense', description: 'Electricity, water, internet' },
  { code: '6300', name: 'Office Supplies', type: 'expense', subType: 'Operating Expense', description: 'Office supplies and materials' },
  { code: '6400', name: 'Depreciation Expense', type: 'expense', subType: 'Operating Expense', description: 'Depreciation on assets' },
  { code: '6500', name: 'Marketing Expense', type: 'expense', subType: 'Operating Expense', description: 'Marketing and advertising' },
  { code: '6600', name: 'Professional Fees', type: 'expense', subType: 'Operating Expense', description: 'Legal and accounting fees' },
  { code: '6700', name: 'Interest Expense', type: 'expense', subType: 'Non-operating Expense', description: 'Interest on loans' }
];

async function seedChartOfAccounts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rayerp');
    console.log('Connected to MongoDB');

    // Clear existing accounts
    await Account.deleteMany({});
    console.log('Cleared existing accounts');

    // Insert default accounts
    await Account.insertMany(defaultAccounts);
    console.log(`Seeded ${defaultAccounts.length} accounts`);

    console.log('Chart of Accounts seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding chart of accounts:', error);
    process.exit(1);
  }
}

seedChartOfAccounts();