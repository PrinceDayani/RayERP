import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const dropOldAccountCollection = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI!);
    
    await mongoose.connection.db.collection('accounts').drop();
    console.log('✅ Dropped old "accounts" collection');
    
    process.exit(0);
  } catch (error: any) {
    if (error.message.includes('ns not found')) {
      console.log('⚠️  Collection already dropped or does not exist');
    } else {
      console.error('❌ Error:', error);
    }
    process.exit(1);
  }
};

dropOldAccountCollection();
