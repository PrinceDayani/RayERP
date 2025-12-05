import mongoose from 'mongoose';
import { Voucher } from '../models/Voucher';
import ChartOfAccount from '../models/ChartOfAccount';
import User from '../models/User';
import dotenv from 'dotenv';

dotenv.config();

const populateVouchers = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/rayerp';
    await mongoose.connect(mongoUri);
    console.log('📦 Connected to database');

    const adminUser = await User.findOne().sort({ createdAt: 1 }).limit(1);
    if (!adminUser) {
      console.log('❌ No user found. Please create a user first.');
      process.exit(1);
    }
    console.log(`✅ Using user: ${adminUser.name || adminUser.email}`);

    // Get accounts
    const cashAccount = await ChartOfAccount.findOne({ name: /cash/i });
    const bankAccount = await ChartOfAccount.findOne({ name: /bank/i });
    const salesAccount = await ChartOfAccount.findOne({ name: /sales|revenue/i });
    const purchaseAccount = await ChartOfAccount.findOne({ name: /purchase|expense/i });
    const debtorsAccount = await ChartOfAccount.findOne({ name: /debtor|receivable/i });
    const creditorsAccount = await ChartOfAccount.findOne({ name: /creditor|payable/i });

    if (!cashAccount || !bankAccount || !salesAccount || !purchaseAccount) {
      console.log('❌ Required accounts not found. Please create chart of accounts first.');
      process.exit(1);
    }

    console.log('✅ Found required accounts');

    // Clear existing vouchers
    await Voucher.deleteMany({});
    console.log('🗑️  Cleared existing vouchers');

    const vouchers = [];
    const today = new Date();

    // Payment Vouchers
    for (let i = 0; i < 5; i++) {
      const amount = (Math.random() * 50000 + 10000).toFixed(2);
      const date = new Date(today);
      date.setDate(date.getDate() - Math.floor(Math.random() * 60));

      vouchers.push({
        voucherType: 'payment',
        voucherNumber: `PAY24${String(i + 1).padStart(6, '0')}`,
        date,
        reference: `REF-PAY-${i + 1}`,
        narration: `Payment to vendor for supplies - Invoice ${1000 + i}`,
        partyName: `Vendor ${String.fromCharCode(65 + i)} Pvt Ltd`,
        paymentMode: ['cash', 'bank', 'cheque', 'upi'][Math.floor(Math.random() * 4)],
        lines: [
          {
            accountId: purchaseAccount._id,
            debit: parseFloat(amount),
            credit: 0,
            description: 'Purchase expense'
          },
          {
            accountId: Math.random() > 0.5 ? cashAccount._id : bankAccount._id,
            debit: 0,
            credit: parseFloat(amount),
            description: 'Payment made'
          }
        ],
        totalAmount: parseFloat(amount),
        status: Math.random() > 0.3 ? 'posted' : 'draft',
        isPosted: Math.random() > 0.3,
        createdBy: adminUser._id
      });
    }

    // Receipt Vouchers
    for (let i = 0; i < 5; i++) {
      const amount = (Math.random() * 80000 + 20000).toFixed(2);
      const date = new Date(today);
      date.setDate(date.getDate() - Math.floor(Math.random() * 60));

      vouchers.push({
        voucherType: 'receipt',
        voucherNumber: `REC24${String(i + 1).padStart(6, '0')}`,
        date,
        reference: `REF-REC-${i + 1}`,
        narration: `Receipt from customer for Invoice ${2000 + i}`,
        partyName: `Customer ${String.fromCharCode(65 + i)} Ltd`,
        paymentMode: ['bank', 'upi', 'cheque'][Math.floor(Math.random() * 3)],
        lines: [
          {
            accountId: Math.random() > 0.5 ? cashAccount._id : bankAccount._id,
            debit: parseFloat(amount),
            credit: 0,
            description: 'Payment received'
          },
          {
            accountId: salesAccount._id,
            debit: 0,
            credit: parseFloat(amount),
            description: 'Sales revenue'
          }
        ],
        totalAmount: parseFloat(amount),
        status: Math.random() > 0.2 ? 'posted' : 'draft',
        isPosted: Math.random() > 0.2,
        createdBy: adminUser._id
      });
    }

    // Contra Vouchers
    for (let i = 0; i < 3; i++) {
      const amount = (Math.random() * 30000 + 5000).toFixed(2);
      const date = new Date(today);
      date.setDate(date.getDate() - Math.floor(Math.random() * 45));

      vouchers.push({
        voucherType: 'contra',
        voucherNumber: `CON24${String(i + 1).padStart(6, '0')}`,
        date,
        reference: `REF-CON-${i + 1}`,
        narration: `Cash deposited to bank`,
        lines: [
          {
            accountId: bankAccount._id,
            debit: parseFloat(amount),
            credit: 0,
            description: 'Bank deposit'
          },
          {
            accountId: cashAccount._id,
            debit: 0,
            credit: parseFloat(amount),
            description: 'Cash withdrawal'
          }
        ],
        totalAmount: parseFloat(amount),
        status: 'posted',
        isPosted: true,
        createdBy: adminUser._id
      });
    }

    // Journal Vouchers
    for (let i = 0; i < 4; i++) {
      const amount = (Math.random() * 40000 + 15000).toFixed(2);
      const date = new Date(today);
      date.setDate(date.getDate() - Math.floor(Math.random() * 30));

      vouchers.push({
        voucherType: 'journal',
        voucherNumber: `JOU24${String(i + 1).padStart(6, '0')}`,
        date,
        reference: `REF-JOU-${i + 1}`,
        narration: `Adjustment entry for ${['depreciation', 'accrual', 'provision', 'correction'][i]}`,
        lines: [
          {
            accountId: purchaseAccount._id,
            debit: parseFloat(amount),
            credit: 0,
            description: 'Expense adjustment'
          },
          {
            accountId: salesAccount._id,
            debit: 0,
            credit: parseFloat(amount),
            description: 'Revenue adjustment'
          }
        ],
        totalAmount: parseFloat(amount),
        status: Math.random() > 0.4 ? 'posted' : 'draft',
        isPosted: Math.random() > 0.4,
        createdBy: adminUser._id
      });
    }

    // Sales Vouchers
    for (let i = 0; i < 4; i++) {
      const amount = (Math.random() * 100000 + 30000).toFixed(2);
      const date = new Date(today);
      date.setDate(date.getDate() - Math.floor(Math.random() * 40));

      vouchers.push({
        voucherType: 'sales',
        voucherNumber: `SAL24${String(i + 1).padStart(6, '0')}`,
        date,
        reference: `INV-${3000 + i}`,
        narration: `Sales invoice to ${String.fromCharCode(65 + i)} Corporation`,
        partyName: `${String.fromCharCode(65 + i)} Corporation`,
        invoiceNumber: `INV-${3000 + i}`,
        invoiceDate: date,
        lines: [
          {
            accountId: debtorsAccount?._id || cashAccount._id,
            debit: parseFloat(amount),
            credit: 0,
            description: 'Accounts receivable'
          },
          {
            accountId: salesAccount._id,
            debit: 0,
            credit: parseFloat(amount),
            description: 'Sales revenue'
          }
        ],
        totalAmount: parseFloat(amount),
        status: 'posted',
        isPosted: true,
        createdBy: adminUser._id
      });
    }

    // Purchase Vouchers
    for (let i = 0; i < 4; i++) {
      const amount = (Math.random() * 70000 + 20000).toFixed(2);
      const date = new Date(today);
      date.setDate(date.getDate() - Math.floor(Math.random() * 40));

      vouchers.push({
        voucherType: 'purchase',
        voucherNumber: `PUR24${String(i + 1).padStart(6, '0')}`,
        date,
        reference: `BILL-${4000 + i}`,
        narration: `Purchase from ${String.fromCharCode(65 + i)} Suppliers`,
        partyName: `${String.fromCharCode(65 + i)} Suppliers`,
        invoiceNumber: `BILL-${4000 + i}`,
        invoiceDate: date,
        lines: [
          {
            accountId: purchaseAccount._id,
            debit: parseFloat(amount),
            credit: 0,
            description: 'Purchase expense'
          },
          {
            accountId: creditorsAccount?._id || bankAccount._id,
            debit: 0,
            credit: parseFloat(amount),
            description: 'Accounts payable'
          }
        ],
        totalAmount: parseFloat(amount),
        status: 'posted',
        isPosted: true,
        createdBy: adminUser._id
      });
    }

    await Voucher.insertMany(vouchers);
    console.log(`✅ Created ${vouchers.length} vouchers`);

    // Calculate statistics
    const stats = await Voucher.aggregate([
      {
        $group: {
          _id: '$voucherType',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' },
          posted: { $sum: { $cond: [{ $eq: ['$status', 'posted'] }, 1, 0] } },
          draft: { $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] } }
        }
      }
    ]);

    console.log('\n📊 Voucher Statistics:');
    stats.forEach(stat => {
      console.log(`\n${stat._id.toUpperCase()}:`);
      console.log(`  Total: ${stat.count}`);
      console.log(`  Posted: ${stat.posted}`);
      console.log(`  Draft: ${stat.draft}`);
      console.log(`  Amount: ₹${stat.totalAmount.toLocaleString('en-IN')}`);
    });

    console.log('\n✅ Voucher data populated successfully!');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
};

populateVouchers();
