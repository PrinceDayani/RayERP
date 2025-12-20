import mongoose from 'mongoose';
import Contact from '../models/Contact';
import { createCustomerLedgerAccount } from '../utils/customerLedger';
import dotenv from 'dotenv';

dotenv.config();

const fixCustomerAccounts = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI!);
    
    const customersWithoutAccounts = await Contact.find({
      $or: [{ isCustomer: true }, { isVendor: true }],
      ledgerAccountId: { $exists: false }
    });

    console.log(`Found ${customersWithoutAccounts.length} customers/vendors without ledger accounts`);

    for (const contact of customersWithoutAccounts) {
      try {
        const accountId = await createCustomerLedgerAccount(
          contact._id.toString(),
          contact.name,
          contact.createdBy.toString(),
          Boolean(contact.isVendor)
        );
        
        contact.ledgerAccountId = accountId;
        await contact.save();
        
        console.log(`✅ Created account for ${contact.name} (${contact.isVendor ? 'Vendor' : 'Customer'})`);
      } catch (error) {
        console.error(`❌ Failed for ${contact.name}:`, error instanceof Error ? error.message : error);
      }
    }

    console.log('✅ Done!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

fixCustomerAccounts();
