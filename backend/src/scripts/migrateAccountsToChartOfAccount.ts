import mongoose from 'mongoose';
import ChartOfAccount from '../models/ChartOfAccount';
import dotenv from 'dotenv';

dotenv.config();

const migrateAccounts = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI!);
    
    const oldAccounts = await ChartOfAccount.find();
    console.log(`Found ${oldAccounts.length} accounts in old Account model`);
    
    let migrated = 0;
    let skipped = 0;
    
    for (const oldAcc of oldAccounts) {
      const exists = await ChartOfAccount.findOne({ code: oldAcc.code });
      
      if (exists) {
        console.log(`⚠️  Skipped ${oldAcc.code} - already exists in ChartOfAccount`);
        skipped++;
        continue;
      }
      
      await ChartOfAccount.create({
        code: oldAcc.code,
        name: oldAcc.name,
        type: oldAcc.type?.toUpperCase() || 'ASSET',
        subType: oldAcc.subType,
        category: oldAcc.category,
        level: oldAcc.level || 0,
        parentId: oldAcc.parentId,
        balance: oldAcc.balance || 0,
        openingBalance: oldAcc.openingBalance || 0,
        currency: oldAcc.currency || 'INR',
        isActive: oldAcc.isActive !== false,
        isGroup: oldAcc.isGroup || false,
        allowPosting: oldAcc.allowPosting !== false,
        description: oldAcc.description,
        createdBy: oldAcc.createdBy
      });
      
      console.log(`✅ Migrated ${oldAcc.code} - ${oldAcc.name}`);
      migrated++;
    }
    
    console.log(`\n✅ Migration complete!`);
    console.log(`   Migrated: ${migrated}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Total in ChartOfAccount: ${await ChartOfAccount.countDocuments()}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

migrateAccounts();


