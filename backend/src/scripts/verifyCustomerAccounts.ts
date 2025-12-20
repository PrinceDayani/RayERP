import mongoose from 'mongoose';
import Contact from '../models/Contact';
import ChartOfAccount from '../models/ChartOfAccount';
import dotenv from 'dotenv';

dotenv.config();

const verifyCustomerAccounts = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI!);
    
    const customers = await Contact.find({ isCustomer: true }).select('name ledgerAccountId');
    console.log(`\nTotal customers: ${customers.length}`);
    
    for (const customer of customers) {
      if (customer.ledgerAccountId) {
        const account = await ChartOfAccount.findById(customer.ledgerAccountId);
        if (account) {
          console.log(`✅ ${customer.name} -> ${account.code} (${account.name})`);
        } else {
          console.log(`❌ ${customer.name} -> Account ID exists but not found in ChartOfAccount`);
        }
      } else {
        console.log(`⚠️  ${customer.name} -> No ledger account linked`);
      }
    }
    
    console.log('\n--- All Customer Accounts in Chart of Accounts ---');
    const customerAccounts = await ChartOfAccount.find({ 
      contactId: { $exists: true, $ne: null } 
    }).populate('contactId', 'name');
    
    console.log(`Found ${customerAccounts.length} accounts with contactId`);
    customerAccounts.forEach(acc => {
      console.log(`${acc.code} - ${acc.name} (Contact: ${(acc.contactId as any)?.name || 'N/A'})`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

verifyCustomerAccounts();
