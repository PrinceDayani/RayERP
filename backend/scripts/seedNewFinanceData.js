const mongoose = require('mongoose');
require('dotenv').config();

const seedNewFinanceData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;

    // 1. Create Groups
    console.log('\n📁 Creating Groups...');
    const groupData = [
      { code: 'GRP-ASSETS', name: 'Assets', type: 'assets', isActive: true },
      { code: 'GRP-LIABILITIES', name: 'Liabilities', type: 'liabilities', isActive: true },
      { code: 'GRP-INCOME', name: 'Income', type: 'income', isActive: true },
      { code: 'GRP-EXPENSES', name: 'Expenses', type: 'expenses', isActive: true }
    ];
    const groups = await db.collection('accountgroups').insertMany(groupData);
    const groupIds = Object.values(groups.insertedIds);
    console.log(`✅ Created ${groupIds.length} groups`);

    // 2. Create Level 1 SubGroups
    console.log('\n📂 Creating Level 1 SubGroups...');
    const level1Data = [
      // Assets
      { code: 'SG1-CURR-ASSETS', name: 'Current Assets', groupId: groupIds[0], parentSubGroupId: null, level: 1, isActive: true },
      { code: 'SG1-FIXED-ASSETS', name: 'Fixed Assets', groupId: groupIds[0], parentSubGroupId: null, level: 1, isActive: true },
      // Liabilities
      { code: 'SG1-CURR-LIAB', name: 'Current Liabilities', groupId: groupIds[1], parentSubGroupId: null, level: 1, isActive: true },
      { code: 'SG1-LONG-LIAB', name: 'Long-term Liabilities', groupId: groupIds[1], parentSubGroupId: null, level: 1, isActive: true },
      // Income
      { code: 'SG1-OPER-INC', name: 'Operating Income', groupId: groupIds[2], parentSubGroupId: null, level: 1, isActive: true },
      { code: 'SG1-OTHER-INC', name: 'Other Income', groupId: groupIds[2], parentSubGroupId: null, level: 1, isActive: true },
      // Expenses
      { code: 'SG1-OPER-EXP', name: 'Operating Expenses', groupId: groupIds[3], parentSubGroupId: null, level: 1, isActive: true },
      { code: 'SG1-ADMIN-EXP', name: 'Administrative Expenses', groupId: groupIds[3], parentSubGroupId: null, level: 1, isActive: true }
    ];
    const level1 = await db.collection('accountsubgroups').insertMany(level1Data);
    const level1Ids = Object.values(level1.insertedIds);
    console.log(`✅ Created ${level1Ids.length} level-1 subgroups`);

    // 3. Create Level 2 SubGroups
    console.log('\n📂 Creating Level 2 SubGroups...');
    const level2Data = [
      // Current Assets
      { code: 'SG2-CASH', name: 'Cash & Bank', groupId: groupIds[0], parentSubGroupId: level1Ids[0], level: 2, isActive: true },
      { code: 'SG2-RECEIVABLES', name: 'Accounts Receivable', groupId: groupIds[0], parentSubGroupId: level1Ids[0], level: 2, isActive: true },
      { code: 'SG2-INVENTORY', name: 'Inventory', groupId: groupIds[0], parentSubGroupId: level1Ids[0], level: 2, isActive: true },
      // Fixed Assets
      { code: 'SG2-PROPERTY', name: 'Property', groupId: groupIds[0], parentSubGroupId: level1Ids[1], level: 2, isActive: true },
      { code: 'SG2-EQUIPMENT', name: 'Equipment', groupId: groupIds[0], parentSubGroupId: level1Ids[1], level: 2, isActive: true },
      // Current Liabilities
      { code: 'SG2-PAYABLES', name: 'Accounts Payable', groupId: groupIds[1], parentSubGroupId: level1Ids[2], level: 2, isActive: true },
      { code: 'SG2-SHORT-LOANS', name: 'Short-term Loans', groupId: groupIds[1], parentSubGroupId: level1Ids[2], level: 2, isActive: true },
      // Long-term Liabilities
      { code: 'SG2-LONG-LOANS', name: 'Long-term Loans', groupId: groupIds[1], parentSubGroupId: level1Ids[3], level: 2, isActive: true },
      // Operating Income
      { code: 'SG2-SALES', name: 'Sales Revenue', groupId: groupIds[2], parentSubGroupId: level1Ids[4], level: 2, isActive: true },
      { code: 'SG2-SERVICE', name: 'Service Revenue', groupId: groupIds[2], parentSubGroupId: level1Ids[4], level: 2, isActive: true },
      // Operating Expenses
      { code: 'SG2-SALARIES', name: 'Salaries & Wages', groupId: groupIds[3], parentSubGroupId: level1Ids[6], level: 2, isActive: true },
      { code: 'SG2-UTILITIES', name: 'Utilities', groupId: groupIds[3], parentSubGroupId: level1Ids[6], level: 2, isActive: true }
    ];
    const level2 = await db.collection('accountsubgroups').insertMany(level2Data);
    const level2Ids = Object.values(level2.insertedIds);
    console.log(`✅ Created ${level2Ids.length} level-2 subgroups`);

    // 4. Create Level 3 SubGroups (optional deeper nesting)
    console.log('\n📂 Creating Level 3 SubGroups...');
    const level3Data = [
      { code: 'SG3-PETTY-CASH', name: 'Petty Cash', groupId: groupIds[0], parentSubGroupId: level2Ids[0], level: 3, isActive: true },
      { code: 'SG3-BANK-ACC', name: 'Bank Accounts', groupId: groupIds[0], parentSubGroupId: level2Ids[0], level: 3, isActive: true },
      { code: 'SG3-TRADE-REC', name: 'Trade Receivables', groupId: groupIds[0], parentSubGroupId: level2Ids[1], level: 3, isActive: true },
      { code: 'SG3-RAW-MAT', name: 'Raw Materials', groupId: groupIds[0], parentSubGroupId: level2Ids[2], level: 3, isActive: true },
      { code: 'SG3-FINISHED', name: 'Finished Goods', groupId: groupIds[0], parentSubGroupId: level2Ids[2], level: 3, isActive: true }
    ];
    const level3 = await db.collection('accountsubgroups').insertMany(level3Data);
    const level3Ids = Object.values(level3.insertedIds);
    console.log(`✅ Created ${level3Ids.length} level-3 subgroups`);

    // 5. Create Accounts
    console.log('\n💼 Creating Accounts...');
    const accountData = [
      // Cash accounts
      { code: 'ACC-001', name: 'Office Petty Cash', subGroupId: level3Ids[0], type: 'asset', balance: 5000, openingBalance: 5000, currency: 'INR', isActive: true, isGroup: false },
      { code: 'ACC-002', name: 'Main Bank Account - HDFC', subGroupId: level3Ids[1], type: 'asset', balance: 500000, openingBalance: 500000, currency: 'INR', isActive: true, isGroup: false },
      { code: 'ACC-003', name: 'Savings Account - SBI', subGroupId: level3Ids[1], type: 'asset', balance: 200000, openingBalance: 200000, currency: 'INR', isActive: true, isGroup: false },
      // Receivables
      { code: 'ACC-004', name: 'Customer Receivables', subGroupId: level3Ids[2], type: 'asset', balance: 150000, openingBalance: 150000, currency: 'INR', isActive: true, isGroup: false },
      // Inventory
      { code: 'ACC-005', name: 'Raw Material Stock', subGroupId: level3Ids[3], type: 'asset', balance: 80000, openingBalance: 80000, currency: 'INR', isActive: true, isGroup: false },
      { code: 'ACC-006', name: 'Finished Goods Stock', subGroupId: level3Ids[4], type: 'asset', balance: 120000, openingBalance: 120000, currency: 'INR', isActive: true, isGroup: false },
      // Property & Equipment
      { code: 'ACC-007', name: 'Office Building', subGroupId: level2Ids[3], type: 'asset', balance: 5000000, openingBalance: 5000000, currency: 'INR', isActive: true, isGroup: false },
      { code: 'ACC-008', name: 'Machinery', subGroupId: level2Ids[4], type: 'asset', balance: 800000, openingBalance: 800000, currency: 'INR', isActive: true, isGroup: false },
      { code: 'ACC-009', name: 'Computers & IT Equipment', subGroupId: level2Ids[4], type: 'asset', balance: 150000, openingBalance: 150000, currency: 'INR', isActive: true, isGroup: false },
      // Liabilities
      { code: 'ACC-010', name: 'Supplier Payables', subGroupId: level2Ids[5], type: 'liability', balance: 100000, openingBalance: 100000, currency: 'INR', isActive: true, isGroup: false },
      { code: 'ACC-011', name: 'Short-term Bank Loan', subGroupId: level2Ids[6], type: 'liability', balance: 200000, openingBalance: 200000, currency: 'INR', isActive: true, isGroup: false },
      { code: 'ACC-012', name: 'Long-term Bank Loan', subGroupId: level2Ids[7], type: 'liability', balance: 1000000, openingBalance: 1000000, currency: 'INR', isActive: true, isGroup: false },
      // Income
      { code: 'ACC-013', name: 'Product Sales', subGroupId: level2Ids[8], type: 'revenue', balance: 0, openingBalance: 0, currency: 'INR', isActive: true, isGroup: false },
      { code: 'ACC-014', name: 'Consulting Services', subGroupId: level2Ids[9], type: 'revenue', balance: 0, openingBalance: 0, currency: 'INR', isActive: true, isGroup: false },
      // Expenses
      { code: 'ACC-015', name: 'Employee Salaries', subGroupId: level2Ids[10], type: 'expense', balance: 0, openingBalance: 0, currency: 'INR', isActive: true, isGroup: false },
      { code: 'ACC-016', name: 'Electricity Bill', subGroupId: level2Ids[11], type: 'expense', balance: 0, openingBalance: 0, currency: 'INR', isActive: true, isGroup: false },
      { code: 'ACC-017', name: 'Internet & Phone', subGroupId: level2Ids[11], type: 'expense', balance: 0, openingBalance: 0, currency: 'INR', isActive: true, isGroup: false }
    ];
    const accounts = await db.collection('accounts').insertMany(accountData);
    const accountIds = Object.values(accounts.insertedIds);
    console.log(`✅ Created ${accountIds.length} accounts`);

    // 6. Create Ledgers
    console.log('\n📒 Creating Ledgers...');
    const ledgerData = [
      // Petty Cash Ledgers
      { code: 'LED-001', name: 'Office Petty Cash - Main', accountId: accountIds[0], openingBalance: 3000, currentBalance: 3000, balanceType: 'debit', currency: 'INR', isActive: true },
      { code: 'LED-002', name: 'Office Petty Cash - Branch', accountId: accountIds[0], openingBalance: 2000, currentBalance: 2000, balanceType: 'debit', currency: 'INR', isActive: true },
      // Bank Ledgers
      { code: 'LED-003', name: 'HDFC Current Account', accountId: accountIds[1], openingBalance: 500000, currentBalance: 500000, balanceType: 'debit', currency: 'INR', isActive: true },
      { code: 'LED-004', name: 'SBI Savings Account', accountId: accountIds[2], openingBalance: 200000, currentBalance: 200000, balanceType: 'debit', currency: 'INR', isActive: true },
      // Customer Ledgers
      { code: 'LED-005', name: 'Customer A', accountId: accountIds[3], openingBalance: 50000, currentBalance: 50000, balanceType: 'debit', currency: 'INR', isActive: true },
      { code: 'LED-006', name: 'Customer B', accountId: accountIds[3], openingBalance: 100000, currentBalance: 100000, balanceType: 'debit', currency: 'INR', isActive: true },
      // Inventory Ledgers
      { code: 'LED-007', name: 'Steel Raw Material', accountId: accountIds[4], openingBalance: 40000, currentBalance: 40000, balanceType: 'debit', currency: 'INR', isActive: true },
      { code: 'LED-008', name: 'Plastic Raw Material', accountId: accountIds[4], openingBalance: 40000, currentBalance: 40000, balanceType: 'debit', currency: 'INR', isActive: true },
      { code: 'LED-009', name: 'Product A Stock', accountId: accountIds[5], openingBalance: 60000, currentBalance: 60000, balanceType: 'debit', currency: 'INR', isActive: true },
      { code: 'LED-010', name: 'Product B Stock', accountId: accountIds[5], openingBalance: 60000, currentBalance: 60000, balanceType: 'debit', currency: 'INR', isActive: true },
      // Supplier Ledgers
      { code: 'LED-011', name: 'Supplier X', accountId: accountIds[9], openingBalance: 50000, currentBalance: 50000, balanceType: 'credit', currency: 'INR', isActive: true },
      { code: 'LED-012', name: 'Supplier Y', accountId: accountIds[9], openingBalance: 50000, currentBalance: 50000, balanceType: 'credit', currency: 'INR', isActive: true }
    ];
    const ledgers = await db.collection('accountledgers').insertMany(ledgerData);
    console.log(`✅ Created ${ledgers.insertedCount} ledgers`);

    console.log('\n✅ Finance data seeded successfully!');
    console.log('\n📊 Summary:');
    console.log(`   Groups: ${groupIds.length}`);
    console.log(`   Level-1 SubGroups: ${level1Ids.length}`);
    console.log(`   Level-2 SubGroups: ${level2Ids.length}`);
    console.log(`   Level-3 SubGroups: ${level3Ids.length}`);
    console.log(`   Accounts: ${accountIds.length}`);
    console.log(`   Ledgers: ${ledgers.insertedCount}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

seedNewFinanceData();
