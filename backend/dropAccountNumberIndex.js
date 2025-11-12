const mongoose = require('mongoose');
require('dotenv').config();

async function dropIndex() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('accounts');

    // List all indexes
    const indexes = await collection.indexes();
    console.log('Current indexes:', indexes);

    // Drop the accountNumber index if it exists
    try {
       console.log('✅ Successfully dropped accountNumber_1 index');
    } catch (error) {
      if (error.code === 27) {
        console.log('Index accountNumber_1 does not exist');
      } else {
        throw error;
      }
    }

    // List indexes after dropping
    const indexesAfter = await collection.indexes();
    console.log('Indexes after drop:', indexesAfter);

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

dropIndex();
