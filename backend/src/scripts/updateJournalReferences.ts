import mongoose from 'mongoose';
import { Account } from '../models/Account';
import ChartOfAccount from '../models/ChartOfAccount';
import JournalEntry from '../models/JournalEntry';
import { Ledger } from '../models/Ledger';
import dotenv from 'dotenv';

dotenv.config();

const updateJournalReferences = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI!);
    
    const oldAccounts = await Account.find();
    const accountMap = new Map();
    
    for (const oldAcc of oldAccounts) {
      const newAcc = await ChartOfAccount.findOne({ code: oldAcc.code });
      if (newAcc) {
        accountMap.set(oldAcc._id.toString(), newAcc._id);
      }
    }
    
    console.log(`Found ${accountMap.size} account mappings`);
    
    // Update Journal Entries
    const journalEntries = await JournalEntry.find();
    let updatedJournals = 0;
    
    for (const entry of journalEntries) {
      let updated = false;
      
      for (const line of entry.lines) {
        const oldId = line.account?.toString() || line.accountId?.toString();
        if (oldId && accountMap.has(oldId)) {
          line.account = accountMap.get(oldId);
          line.accountId = accountMap.get(oldId);
          updated = true;
        }
      }
      
      if (updated) {
        await entry.save();
        updatedJournals++;
      }
    }
    
    console.log(`✅ Updated ${updatedJournals} journal entries`);
    
    // Update Ledger Entries
    const ledgerEntries = await Ledger.find();
    let updatedLedgers = 0;
    
    for (const ledger of ledgerEntries) {
      const oldId = ledger.accountId?.toString();
      if (oldId && accountMap.has(oldId)) {
        ledger.accountId = accountMap.get(oldId);
        await ledger.save();
        updatedLedgers++;
      }
    }
    
    console.log(`✅ Updated ${updatedLedgers} ledger entries`);
    console.log(`\n✅ Migration complete!`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

updateJournalReferences();
