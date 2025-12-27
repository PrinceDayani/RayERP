// Migration script to consolidate Payment and Invoice collections into Finance collection
const mongoose = require('mongoose');
require('dotenv').config();

async function migrateFinanceData() {
  try {
    console.log('🚀 Starting Finance Models Migration...');
    
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/rayerp');
    console.log('✅ Connected to MongoDB');
    
    const db = mongoose.connection.db;
    
    // Check if collections exist
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    let migratedPayments = 0;
    let migratedInvoices = 0;
    
    // Migrate payments collection if it exists
    if (collectionNames.includes('payments')) {
      console.log('📦 Migrating payments collection...');
      const paymentsCollection = db.collection('payments');
      const payments = await paymentsCollection.find({}).toArray();
      
      if (payments.length > 0) {
        const financesCollection = db.collection('finances');
        
        for (const payment of payments) {
          // Add discriminator type and ensure proper structure
          const financeDoc = {
            ...payment,
            type: 'payment',
            __t: 'payment' // Mongoose discriminator key
          };
          
          try {
            await financesCollection.insertOne(financeDoc);
            migratedPayments++;
          } catch (error) {
            if (error.code !== 11000) { // Ignore duplicate key errors
              console.error(`Error migrating payment ${payment._id}:`, error.message);
            }
          }
        }
        
        // Backup original collection
        await paymentsCollection.rename('payments_backup_' + Date.now());
        console.log(`✅ Migrated ${migratedPayments} payments`);
      }
    }
    
    // Migrate invoices collection if it exists
    if (collectionNames.includes('invoices')) {
      console.log('📦 Migrating invoices collection...');
      const invoicesCollection = db.collection('invoices');
      const invoices = await invoicesCollection.find({}).toArray();
      
      if (invoices.length > 0) {
        const financesCollection = db.collection('finances');
        
        for (const invoice of invoices) {
          // Add discriminator type and ensure proper structure
          const financeDoc = {
            ...invoice,
            type: 'invoice',
            __t: 'invoice' // Mongoose discriminator key
          };
          
          try {
            await financesCollection.insertOne(financeDoc);
            migratedInvoices++;
          } catch (error) {
            if (error.code !== 11000) { // Ignore duplicate key errors
              console.error(`Error migrating invoice ${invoice._id}:`, error.message);
            }
          }
        }
        
        // Backup original collection
        await invoicesCollection.rename('invoices_backup_' + Date.now());
        console.log(`✅ Migrated ${migratedInvoices} invoices`);
      }
    }
    
    // Update Voucher status enums to uppercase if needed
    const vouchersCollection = db.collection('vouchers');
    const vouchersToUpdate = await vouchersCollection.find({
      status: { $in: ['draft', 'posted', 'cancelled'] }
    }).toArray();
    
    if (vouchersToUpdate.length > 0) {
      console.log(`📦 Updating ${vouchersToUpdate.length} voucher status enums...`);
      
      const statusMap = {
        'draft': 'DRAFT',
        'posted': 'POSTED', 
        'cancelled': 'CANCELLED'
      };
      
      for (const voucher of vouchersToUpdate) {
        await vouchersCollection.updateOne(
          { _id: voucher._id },
          { $set: { status: statusMap[voucher.status] || voucher.status } }
        );
      }
      
      console.log(`✅ Updated ${vouchersToUpdate.length} voucher status enums`);
    }
    
    console.log('🎉 Migration completed successfully!');
    console.log(`📊 Summary: ${migratedPayments} payments, ${migratedInvoices} invoices migrated, ${vouchersToUpdate.length} vouchers updated`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateFinanceData()
    .then(() => {
      console.log('✅ Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateFinanceData };