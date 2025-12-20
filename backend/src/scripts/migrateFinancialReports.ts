/**
 * Financial Reports Data Migration Script
 * Run this to ensure all data structures are compatible
 */

import mongoose from 'mongoose';
import ChartOfAccount from '../models/ChartOfAccount';
import { Ledger } from '../models/Ledger';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/rayerp';

async function migrateFinancialReportsData() {
  try {
    console.log('🚀 Starting Financial Reports Data Migration...');
    
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // 1. Ensure all accounts have proper subType and category
    console.log('\n📊 Step 1: Updating Chart of Accounts...');
    
    const accounts = await ChartOfAccount.find({ isActive: true });
    let updated = 0;

    for (const account of accounts) {
      let needsUpdate = false;
      const updates: any = {};

      // Auto-categorize COGS accounts
      if (account.type === 'EXPENSE' && !account.subType) {
        const name = account.name.toLowerCase();
        if (name.includes('cost of goods') || name.includes('cogs') || 
            name.includes('direct material') || name.includes('direct labor')) {
          updates.subType = 'cogs';
          updates.category = 'Cost of Goods Sold';
          needsUpdate = true;
        }
      }

      // Auto-categorize depreciation
      if (account.type === 'EXPENSE' && !account.subType) {
        const name = account.name.toLowerCase();
        if (name.includes('depreciation') || name.includes('amortization')) {
          updates.subType = 'depreciation';
          updates.category = 'Depreciation';
          needsUpdate = true;
        }
      }

      // Auto-categorize interest
      if (account.type === 'EXPENSE' && !account.subType) {
        const name = account.name.toLowerCase();
        if (name.includes('interest')) {
          updates.subType = 'interest';
          updates.category = 'Interest';
          needsUpdate = true;
        }
      }

      // Auto-categorize tax
      if (account.type === 'EXPENSE' && !account.subType) {
        const name = account.name.toLowerCase();
        if (name.includes('tax') || name.includes('gst') || name.includes('income tax')) {
          updates.subType = 'tax';
          updates.category = 'Tax';
          needsUpdate = true;
        }
      }

      // Auto-categorize assets
      if (account.type === 'ASSET' && !account.subType) {
        const name = account.name.toLowerCase();
        if (name.includes('cash') || name.includes('bank')) {
          updates.subType = 'cash';
          updates.category = 'Current Assets';
          needsUpdate = true;
        } else if (name.includes('receivable') || name.includes('debtors')) {
          updates.subType = 'receivable';
          updates.category = 'Current Assets';
          needsUpdate = true;
        } else if (name.includes('inventory') || name.includes('stock')) {
          updates.subType = 'inventory';
          updates.category = 'Current Assets';
          needsUpdate = true;
        } else if (name.includes('fixed') || name.includes('equipment') || 
                   name.includes('building') || name.includes('vehicle')) {
          updates.subType = 'fixed';
          updates.category = 'Fixed Assets';
          needsUpdate = true;
        }
      }

      // Auto-categorize liabilities
      if (account.type === 'LIABILITY' && !account.subType) {
        const name = account.name.toLowerCase();
        if (name.includes('payable') || name.includes('creditors')) {
          updates.subType = 'payable';
          updates.category = 'Current Liabilities';
          needsUpdate = true;
        } else if (name.includes('loan') || name.includes('mortgage')) {
          updates.subType = 'long-term';
          updates.category = 'Long-term Liabilities';
          needsUpdate = true;
        }
      }

      if (needsUpdate) {
        await ChartOfAccount.findByIdAndUpdate(account._id, updates);
        updated++;
        console.log(`  ✓ Updated: ${account.code} - ${account.name}`);
      }
    }

    console.log(`✅ Updated ${updated} accounts`);

    // 2. Verify ledger entries have proper accountId references
    console.log('\n📊 Step 2: Verifying Ledger Entries...');
    
    const ledgerCount = await Ledger.countDocuments();
    const invalidLedgers = await Ledger.find({ accountId: null });
    
    console.log(`  Total Ledger Entries: ${ledgerCount}`);
    console.log(`  Invalid Entries: ${invalidLedgers.length}`);
    
    if (invalidLedgers.length > 0) {
      console.log('  ⚠️  Warning: Found ledger entries without accountId');
      console.log('  Please review and fix these entries manually');
    } else {
      console.log('  ✅ All ledger entries are valid');
    }

    // 3. Create indexes for performance
    console.log('\n📊 Step 3: Creating Indexes...');
    
    await Ledger.collection.createIndex({ accountId: 1, date: 1 });
    await Ledger.collection.createIndex({ date: 1 });
    await Ledger.collection.createIndex({ department: 1, date: 1 });
    await Ledger.collection.createIndex({ costCenter: 1, date: 1 });
    await ChartOfAccount.collection.createIndex({ type: 1, isActive: 1 });
    await ChartOfAccount.collection.createIndex({ code: 1 });
    
    console.log('✅ Indexes created');

    // 4. Generate sample data if database is empty
    console.log('\n📊 Step 4: Checking for Sample Data...');
    
    const accountCount = await ChartOfAccount.countDocuments();
    if (accountCount === 0) {
      console.log('  ⚠️  No accounts found. Consider running seed script.');
    } else {
      console.log(`  ✅ Found ${accountCount} accounts`);
    }

    // 5. Validate Trial Balance
    console.log('\n📊 Step 5: Validating Trial Balance...');
    
    const allLedgers = await Ledger.find({});
    const totalDebit = allLedgers.reduce((sum, l) => sum + l.debit, 0);
    const totalCredit = allLedgers.reduce((sum, l) => sum + l.credit, 0);
    const difference = Math.abs(totalDebit - totalCredit);
    
    console.log(`  Total Debit: ₹${totalDebit.toLocaleString('en-IN')}`);
    console.log(`  Total Credit: ₹${totalCredit.toLocaleString('en-IN')}`);
    console.log(`  Difference: ₹${difference.toLocaleString('en-IN')}`);
    
    if (difference < 0.01) {
      console.log('  ✅ Trial Balance is balanced');
    } else {
      console.log('  ⚠️  Trial Balance is out of balance');
      console.log('  Please review ledger entries');
    }

    console.log('\n✅ Migration Complete!');
    console.log('\n📝 Summary:');
    console.log(`  - Accounts Updated: ${updated}`);
    console.log(`  - Total Accounts: ${accountCount}`);
    console.log(`  - Total Ledger Entries: ${ledgerCount}`);
    console.log(`  - Trial Balance: ${difference < 0.01 ? 'Balanced' : 'Out of Balance'}`);
    
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
    
  } catch (error) {
    console.error('❌ Migration Error:', error);
    process.exit(1);
  }
}

// Run migration
if (require.main === module) {
  migrateFinancialReportsData()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export default migrateFinancialReportsData;
