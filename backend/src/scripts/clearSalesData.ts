import mongoose from 'mongoose';
import Invoice from '../models/Invoice';
import dotenv from 'dotenv';

dotenv.config();

const clearSalesData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI!);
    const result = await Invoice.deleteMany({ invoiceType: 'SALES' });
    console.log(`✅ Cleared ${result.deletedCount} sales invoices`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

clearSalesData();
