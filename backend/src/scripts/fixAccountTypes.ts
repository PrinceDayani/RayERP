import mongoose from 'mongoose';
import ChartOfAccount from '../models/ChartOfAccount';
import dotenv from 'dotenv';

dotenv.config();

const fixAccountTypes = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI!);
    
    const accounts = await ChartOfAccount.find();
    let fixed = 0;
    
    for (const acc of accounts) {
      const oldType = acc.type;
      const newType = oldType.toUpperCase() as any;
      
      if (oldType !== newType) {
        acc.type = newType;
        await acc.save();
        console.log(`✅ Fixed ${acc.code}: ${oldType} → ${newType}`);
        fixed++;
      }
    }
    
    console.log(`\n✅ Fixed ${fixed} accounts`);
    console.log(`Total accounts: ${accounts.length}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

fixAccountTypes();
