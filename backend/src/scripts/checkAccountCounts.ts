import mongoose from 'mongoose';
import ChartOfAccount from '../models/ChartOfAccount';
import dotenv from 'dotenv';

dotenv.config();

const checkAccountCounts = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI!);
    
    const chartOfAccountsCount = await ChartOfAccount.countDocuments();
    const oldAccountsCount = await ChartOfAccount.countDocuments();
    
    console.log('\n=== Account Counts ===');
    console.log(`ChartOfAccount model: ${chartOfAccountsCount}`);
    console.log(`Old Account model: ${oldAccountsCount}`);
    console.log(`Total: ${chartOfAccountsCount + oldAccountsCount}`);
    
    console.log('\n=== ChartOfAccount Sample ===');
    const chartSample = await ChartOfAccount.find().limit(5).select('code name type');
    chartSample.forEach(acc => console.log(`${acc.code} - ${acc.name} (${acc.type})`));
    
    console.log('\n=== Old Account Sample ===');
    const oldSample = await ChartOfAccount.find().limit(5).select('code name type');
    oldSample.forEach(acc => console.log(`${acc.code} - ${acc.name} (${acc.type})`));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

checkAccountCounts();


