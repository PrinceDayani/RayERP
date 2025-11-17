const mongoose = require('mongoose');
require('dotenv').config();

const groupSchema = new mongoose.Schema({
  code: String,
  name: String,
  type: String,
  description: String,
  isActive: Boolean
}, { timestamps: true });

const subGroupSchema = new mongoose.Schema({
  code: String,
  name: String,
  groupId: mongoose.Schema.Types.ObjectId,
  description: String,
  isActive: Boolean
}, { timestamps: true });

const ledgerSchema = new mongoose.Schema({
  code: String,
  name: String,
  subGroupId: mongoose.Schema.Types.ObjectId,
  openingBalance: Number,
  currentBalance: Number,
  balanceType: String,
  currency: String,
  isActive: Boolean,
  description: String
}, { timestamps: true });

const AccountGroup = mongoose.model('AccountGroup', groupSchema);
const AccountSubGroup = mongoose.model('AccountSubGroup', subGroupSchema);
const AccountLedger = mongoose.model('AccountLedger', ledgerSchema);

const groups = [
  { code: 'GRP-001', name: 'Assets', type: 'assets', description: 'All company assets' },
  { code: 'GRP-002', name: 'Liabilities', type: 'liabilities', description: 'All company liabilities' },
  { code: 'GRP-003', name: 'Income', type: 'income', description: 'All income sources' },
  { code: 'GRP-004', name: 'Expenses', type: 'expenses', description: 'All company expenses' }
];

const subGroups = [
  // Assets Sub-Groups
  { code: 'SG-A001', name: 'Current Assets', group: 'GRP-001', description: 'Assets convertible to cash within 1 year' },
  { code: 'SG-A002', name: 'Fixed Assets', group: 'GRP-001', description: 'Long-term tangible assets' },
  { code: 'SG-A003', name: 'Cash/Bank', group: 'GRP-001', description: 'Cash and bank accounts' },
  { code: 'SG-A004', name: 'Sundry Debtors', group: 'GRP-001', description: 'Trade receivables' },
  { code: 'SG-A005', name: 'Stock-in-Hand', group: 'GRP-001', description: 'Inventory' },
  { code: 'SG-A006', name: 'Loans & Advances (Asset)', group: 'GRP-001', description: 'Loans given' },
  
  // Liabilities Sub-Groups
  { code: 'SG-L001', name: 'Current Liabilities', group: 'GRP-002', description: 'Short-term obligations' },
  { code: 'SG-L002', name: 'Sundry Creditors', group: 'GRP-002', description: 'Trade payables' },
  { code: 'SG-L003', name: 'Duties & Taxes', group: 'GRP-002', description: 'Tax liabilities' },
  { code: 'SG-L004', name: 'Loans (Liability)', group: 'GRP-002', description: 'Borrowed funds' },
  { code: 'SG-L005', name: 'Capital Account', group: 'GRP-002', description: 'Owner equity' },
  { code: 'SG-L006', name: 'Reserves & Surplus', group: 'GRP-002', description: 'Retained earnings' },
  
  // Income Sub-Groups
  { code: 'SG-I001', name: 'Direct Income', group: 'GRP-003', description: 'Primary business income' },
  { code: 'SG-I002', name: 'Indirect Income', group: 'GRP-003', description: 'Other income' },
  { code: 'SG-I003', name: 'Sales Accounts', group: 'GRP-003', description: 'Revenue from sales' },
  
  // Expenses Sub-Groups
  { code: 'SG-E001', name: 'Direct Expenses', group: 'GRP-004', description: 'Cost of goods sold' },
  { code: 'SG-E002', name: 'Indirect Expenses', group: 'GRP-004', description: 'Operating expenses' },
  { code: 'SG-E003', name: 'Purchase Accounts', group: 'GRP-004', description: 'Purchase of goods' }
];

const ledgers = [
  // Cash/Bank Ledgers
  { code: 'LED-001', name: 'Cash in Hand', subGroup: 'SG-A003', openingBalance: 50000, balanceType: 'debit' },
  { code: 'LED-002', name: 'Petty Cash', subGroup: 'SG-A003', openingBalance: 5000, balanceType: 'debit' },
  { code: 'LED-003', name: 'HDFC Bank - Current A/c', subGroup: 'SG-A003', openingBalance: 500000, balanceType: 'debit' },
  { code: 'LED-004', name: 'SBI - Savings A/c', subGroup: 'SG-A003', openingBalance: 250000, balanceType: 'debit' },
  { code: 'LED-005', name: 'ICICI Bank - CC A/c', subGroup: 'SG-A003', openingBalance: 100000, balanceType: 'debit' },
  
  // Fixed Assets
  { code: 'LED-010', name: 'Land & Building', subGroup: 'SG-A002', openingBalance: 5000000, balanceType: 'debit' },
  { code: 'LED-011', name: 'Plant & Machinery', subGroup: 'SG-A002', openingBalance: 2000000, balanceType: 'debit' },
  { code: 'LED-012', name: 'Furniture & Fixtures', subGroup: 'SG-A002', openingBalance: 150000, balanceType: 'debit' },
  { code: 'LED-013', name: 'Computer & Equipment', subGroup: 'SG-A002', openingBalance: 200000, balanceType: 'debit' },
  { code: 'LED-014', name: 'Vehicles', subGroup: 'SG-A002', openingBalance: 800000, balanceType: 'debit' },
  
  // Sundry Debtors (Sample)
  { code: 'LED-020', name: 'Customer A', subGroup: 'SG-A004', openingBalance: 50000, balanceType: 'debit' },
  { code: 'LED-021', name: 'Customer B', subGroup: 'SG-A004', openingBalance: 75000, balanceType: 'debit' },
  
  // Stock
  { code: 'LED-030', name: 'Raw Materials', subGroup: 'SG-A005', openingBalance: 100000, balanceType: 'debit' },
  { code: 'LED-031', name: 'Finished Goods', subGroup: 'SG-A005', openingBalance: 200000, balanceType: 'debit' },
  
  // Sundry Creditors (Sample)
  { code: 'LED-040', name: 'Supplier X', subGroup: 'SG-L002', openingBalance: 40000, balanceType: 'credit' },
  { code: 'LED-041', name: 'Supplier Y', subGroup: 'SG-L002', openingBalance: 60000, balanceType: 'credit' },
  
  // Duties & Taxes
  { code: 'LED-050', name: 'GST Payable', subGroup: 'SG-L003', openingBalance: 50000, balanceType: 'credit' },
  { code: 'LED-051', name: 'TDS Payable', subGroup: 'SG-L003', openingBalance: 15000, balanceType: 'credit' },
  { code: 'LED-052', name: 'Professional Tax', subGroup: 'SG-L003', openingBalance: 5000, balanceType: 'credit' },
  { code: 'LED-053', name: 'GST Input', subGroup: 'SG-A001', openingBalance: 30000, balanceType: 'debit' },
  
  // Capital
  { code: 'LED-060', name: 'Capital Account', subGroup: 'SG-L005', openingBalance: 5000000, balanceType: 'credit' },
  { code: 'LED-061', name: 'Retained Earnings', subGroup: 'SG-L006', openingBalance: 500000, balanceType: 'credit' },
  
  // Loans
  { code: 'LED-070', name: 'Bank Loan - HDFC', subGroup: 'SG-L004', openingBalance: 1000000, balanceType: 'credit' },
  { code: 'LED-071', name: 'Term Loan', subGroup: 'SG-L004', openingBalance: 500000, balanceType: 'credit' },
  
  // Sales Accounts
  { code: 'LED-080', name: 'Sales Account', subGroup: 'SG-I003', openingBalance: 0, balanceType: 'credit' },
  { code: 'LED-081', name: 'Service Income', subGroup: 'SG-I001', openingBalance: 0, balanceType: 'credit' },
  { code: 'LED-082', name: 'Interest Received', subGroup: 'SG-I002', openingBalance: 0, balanceType: 'credit' },
  { code: 'LED-083', name: 'Discount Received', subGroup: 'SG-I002', openingBalance: 0, balanceType: 'credit' },
  
  // Purchase Accounts
  { code: 'LED-090', name: 'Purchase Account', subGroup: 'SG-E003', openingBalance: 0, balanceType: 'debit' },
  { code: 'LED-091', name: 'Freight Inward', subGroup: 'SG-E001', openingBalance: 0, balanceType: 'debit' },
  
  // Expenses
  { code: 'LED-100', name: 'Salary & Wages', subGroup: 'SG-E002', openingBalance: 0, balanceType: 'debit' },
  { code: 'LED-101', name: 'Rent Paid', subGroup: 'SG-E002', openingBalance: 0, balanceType: 'debit' },
  { code: 'LED-102', name: 'Electricity Charges', subGroup: 'SG-E002', openingBalance: 0, balanceType: 'debit' },
  { code: 'LED-103', name: 'Telephone Expenses', subGroup: 'SG-E002', openingBalance: 0, balanceType: 'debit' },
  { code: 'LED-104', name: 'Office Expenses', subGroup: 'SG-E002', openingBalance: 0, balanceType: 'debit' },
  { code: 'LED-105', name: 'Printing & Stationery', subGroup: 'SG-E002', openingBalance: 0, balanceType: 'debit' },
  { code: 'LED-106', name: 'Travelling Expenses', subGroup: 'SG-E002', openingBalance: 0, balanceType: 'debit' },
  { code: 'LED-107', name: 'Bank Charges', subGroup: 'SG-E002', openingBalance: 0, balanceType: 'debit' },
  { code: 'LED-108', name: 'Interest Paid', subGroup: 'SG-E002', openingBalance: 0, balanceType: 'debit' },
  { code: 'LED-109', name: 'Depreciation', subGroup: 'SG-E002', openingBalance: 0, balanceType: 'debit' }
];

async function seedIndianChartOfAccounts() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/erp-system');
    console.log('✅ Connected to MongoDB');

    await AccountGroup.deleteMany({});
    await AccountSubGroup.deleteMany({});
    await AccountLedger.deleteMany({});
    console.log('🗑️  Cleared existing data');

    const groupMap = new Map();
    const subGroupMap = new Map();

    // Seed Groups
    console.log('\n📁 Creating Groups...');
    for (const grp of groups) {
      const group = await AccountGroup.create({
        code: grp.code,
        name: grp.name,
        type: grp.type,
        description: grp.description,
        isActive: true
      });
      groupMap.set(grp.code, group._id);
      console.log(`   ✓ ${grp.code} - ${grp.name}`);
    }

    // Seed Sub-Groups
    console.log('\n📂 Creating Sub-Groups...');
    for (const sg of subGroups) {
      const groupId = groupMap.get(sg.group);
      const subGroup = await AccountSubGroup.create({
        code: sg.code,
        name: sg.name,
        groupId: groupId,
        description: sg.description,
        isActive: true
      });
      subGroupMap.set(sg.code, subGroup._id);
      console.log(`   ✓ ${sg.code} - ${sg.name}`);
    }

    // Seed Ledgers
    console.log('\n📄 Creating Ledgers...');
    for (const led of ledgers) {
      const subGroupId = subGroupMap.get(led.subGroup);
      await AccountLedger.create({
        code: led.code,
        name: led.name,
        subGroupId: subGroupId,
        openingBalance: led.openingBalance || 0,
        currentBalance: led.openingBalance || 0,
        balanceType: led.balanceType,
        currency: 'INR',
        isActive: true
      });
      console.log(`   ✓ ${led.code} - ${led.name}`);
    }

    const summary = {
      groups: await AccountGroup.countDocuments(),
      subGroups: await AccountSubGroup.countDocuments(),
      ledgers: await AccountLedger.countDocuments()
    };

    console.log('\n📊 Summary:');
    console.log(`   Groups: ${summary.groups}`);
    console.log(`   Sub-Groups: ${summary.subGroups}`);
    console.log(`   Ledgers: ${summary.ledgers}`);
    console.log('\n✅ Indian Chart of Accounts seeded successfully!');

    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

seedIndianChartOfAccounts();
