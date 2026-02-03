import mongoose from 'mongoose';
import ChartOfAccount from '../models/ChartOfAccount';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Validate all accounts have proper subType for P&L categorization
async function validatePLAccounts() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/rayerp');
    
    console.log('🔍 Checking accounts without subType...');
    
    const revenueWithoutSubType = await ChartOfAccount.find({ 
      type: 'revenue', 
      $or: [{ subType: '' }, { subType: { $exists: false } }],
      isActive: true 
    });
    
    const expenseWithoutSubType = await ChartOfAccount.find({ 
      type: 'expense', 
      $or: [{ subType: '' }, { subType: { $exists: false } }],
      isActive: true 
    });
    
    console.log(`\n⚠️  Found ${revenueWithoutSubType.length} revenue accounts without subType`);
    console.log(`⚠️  Found ${expenseWithoutSubType.length} expense accounts without subType`);
    
    if (revenueWithoutSubType.length > 0) {
      console.log('\n📋 Revenue accounts needing subType:');
      revenueWithoutSubType.forEach(acc => {
        console.log(`   - ${acc.code} ${acc.name}`);
      });
    }
    
    if (expenseWithoutSubType.length > 0) {
      console.log('\n📋 Expense accounts needing subType:');
      expenseWithoutSubType.forEach(acc => {
        console.log(`   - ${acc.code} ${acc.name}`);
      });
    }
    
    console.log('\n✅ Validation complete');
    console.log('💡 Run "npm run migrate:accounts" to auto-categorize');
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

validatePLAccounts();

