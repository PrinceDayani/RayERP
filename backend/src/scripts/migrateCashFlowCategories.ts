import mongoose from 'mongoose';
import { Ledger } from '../models/Ledger';
import ChartOfAccount from '../models/ChartOfAccount';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Migration script to add cashFlowCategory to existing ledger entries
 */
async function migrateCashFlowCategories() {
  try {
    await mongoose.connect(process.env.MONGO_URI!);
    console.log('Connected to MongoDB');

    // Get all cash accounts
    const cashAccounts = await ChartOfAccount.find({ type: 'asset', subType: 'cash' });
    const cashAccountIds = cashAccounts.map(a => a._id.toString());

    console.log(`Found ${cashAccounts.length} cash accounts`);

    // Get all ledger entries for cash accounts without category
    const entries = await Ledger.find({
      accountId: { $in: cashAccountIds },
      cashFlowCategory: { $exists: false }
    });

    console.log(`Found ${entries.length} ledger entries to migrate`);

    let updated = 0;
    for (const entry of entries) {
      const desc = entry.description.toLowerCase();
      let category: 'OPERATING' | 'INVESTING' | 'FINANCING' | 'NON_CASH' = 'OPERATING';

      // Auto-categorize based on description
      if (desc.includes('equipment') || desc.includes('asset') || desc.includes('investment')) {
        category = 'INVESTING';
      } else if (desc.includes('loan') || desc.includes('dividend') || desc.includes('capital')) {
        category = 'FINANCING';
      } else if (desc.includes('depreciation') || desc.includes('amortization')) {
        category = 'NON_CASH';
      }

      entry.cashFlowCategory = category;
      await entry.save();
      updated++;

      if (updated % 100 === 0) {
        console.log(`Migrated ${updated} entries...`);
      }
    }

    console.log(`✅ Migration complete! Updated ${updated} ledger entries`);
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
}

migrateCashFlowCategories();

