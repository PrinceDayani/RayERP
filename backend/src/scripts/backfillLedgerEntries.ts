import mongoose from 'mongoose';
import { JournalEntry } from '../models/JournalEntry';
import { Ledger } from '../models/Ledger';
import { Account } from '../models/Account';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function backfillLedgerEntries() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/rayerp');
    
    console.log('🔍 Finding JournalEntries without Ledger entries...');
    
    const journalEntries = await JournalEntry.find({ 
      isPosted: true, 
      status: 'POSTED' 
    });
    
    let created = 0;
    let skipped = 0;
    
    for (const je of journalEntries) {
      const existingCount = await Ledger.countDocuments({ journalEntryId: je._id });
      
      if (existingCount > 0) {
        skipped++;
        continue;
      }
      
      const ledgerEntries = [];
      for (const line of je.lines) {
        const account = await Account.findById(line.account);
        if (!account) continue;
        
        const isDebitNormal = ['asset', 'expense'].includes(account.type);
        const balance = isDebitNormal ? line.debit - line.credit : line.credit - line.debit;
        
        ledgerEntries.push({
          accountId: line.account,
          date: je.entryDate,
          description: line.description || je.description,
          debit: line.debit,
          credit: line.credit,
          balance,
          journalEntryId: je._id,
          reference: je.reference || je.entryNumber,
          department: line.department,
          costCenter: line.costCenter
        });
      }
      
      if (ledgerEntries.length > 0) {
        await Ledger.insertMany(ledgerEntries);
        created += ledgerEntries.length;
        console.log(`✅ Created ${ledgerEntries.length} ledger entries for ${je.entryNumber}`);
      }
    }
    
    console.log(`\n✅ Backfill complete:`);
    console.log(`   - Created: ${created} ledger entries`);
    console.log(`   - Skipped: ${skipped} journal entries (already had ledger entries)`);
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

backfillLedgerEntries();
