const mongoose = require('mongoose');
require('dotenv').config();

const clearFinanceData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;

    console.log('\n🗑️  Clearing finance data...');
    
    await db.collection('accountgroups').deleteMany({});
    console.log('✅ Cleared AccountGroups');
    
    await db.collection('accountsubgroups').deleteMany({});
    console.log('✅ Cleared AccountSubGroups');
    
    await db.collection('accounts').deleteMany({});
    console.log('✅ Cleared Accounts');
    
    await db.collection('accountledgers').deleteMany({});
    console.log('✅ Cleared AccountLedgers');
    
    await db.collection('journalentries').deleteMany({});
    console.log('✅ Cleared JournalEntries');
    
    await db.collection('budgettemplates').deleteMany({});
    console.log('✅ Cleared BudgetTemplates');
    
    await db.collection('budgets').deleteMany({});
    console.log('✅ Cleared Budgets');

    console.log('\n✅ All finance data cleared successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

clearFinanceData();
