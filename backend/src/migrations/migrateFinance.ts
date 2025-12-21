// src/migrations/migrateFinance.ts
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Migration script to copy existing payment and invoice documents into the new Finance collection.
 * Run with: node dist/migrations/migrateFinance.js
 */
async function migrate() {
    try {
        await mongoose.connect(process.env.MONGO_URI as string);
        console.log('✅ Connected to MongoDB');

        const db = mongoose.connection.db;

        // Migrate Payments
        const paymentsCollection = db.collection('payments');
        const payments = await paymentsCollection.find({}).toArray();
        console.log(`📦 Migrating ${payments.length} payments`);

        if (payments.length > 0) {
            const financePayments = payments.map(p => ({
                ...p,
                type: 'payment',
            }));
            await db.collection('finances').insertMany(financePayments);
            console.log(`✅ Migrated ${payments.length} payments`);
        }

        // Migrate Invoices
        const invoicesCollection = db.collection('invoices');
        const invoices = await invoicesCollection.find({}).toArray();
        console.log(`📦 Migrating ${invoices.length} invoices`);

        if (invoices.length > 0) {
            const financeInvoices = invoices.map(inv => ({
                ...inv,
                type: 'invoice',
            }));
            await db.collection('finances').insertMany(financeInvoices);
            console.log(`✅ Migrated ${invoices.length} invoices`);
        }

        console.log('✅ Migration completed successfully');
        console.log('\n⚠️  IMPORTANT: Verify the data in the "finances" collection before dropping old collections.');
        console.log('To drop old collections, uncomment the following lines in this script:\n');
        console.log('// await db.collection("payments").drop();');
        console.log('// await db.collection("invoices").drop();');

        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    } catch (error: any) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    migrate();
}

export default migrate;
