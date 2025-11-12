const mongoose = require('mongoose');
require('dotenv').config();

const deleteAllFinanceRecords = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Delete all finance-related collections
    const collections = [
      'journalentries',
      'accountledgers',
      'accountsubgroups',
      'accountgroups',
      'accounts',
      'budgets',
      'budgettemplates',
      'masterbudgets'
    ];

    for (const collection of collections) {
      const result = await mongoose.connection.db.collection(collection).deleteMany({});
      console.log(`🗑️  Deleted ${result.deletedCount} records from ${collection}`);
    }

    console.log('\n✅ All finance records deleted successfully!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
};

deleteAllFinanceRecords();
