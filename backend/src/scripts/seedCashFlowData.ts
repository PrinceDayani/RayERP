import mongoose from 'mongoose';
import ChartOfAccount from '../models/ChartOfAccount';
import { Ledger } from '../models/Ledger';
import { JournalEntry } from '../models/JournalEntry';
import dotenv from 'dotenv';

dotenv.config();

async function seedCashFlowData() {
  try {
    await mongoose.connect(process.env.MONGO_URI!);
    console.log('Connected to MongoDB');

    const userId = new mongoose.Types.ObjectId();

    const cashAccount = await ChartOfAccount.findOneAndUpdate(
      { code: 'CASH-001' },
      { name: 'Cash in Hand', type: 'ASSET', subType: 'cash', balance: 50000, isActive: true },
      { upsert: true, new: true }
    );

    const bankAccount = await ChartOfAccount.findOneAndUpdate(
      { code: 'BANK-001' },
      { name: 'Bank Account', type: 'ASSET', subType: 'cash', balance: 100000, isActive: true },
      { upsert: true, new: true }
    );

    const arAccount = await ChartOfAccount.findOneAndUpdate(
      { code: 'AR-001' },
      { name: 'Accounts Receivable', type: 'ASSET', balance: 0, isActive: true },
      { upsert: true, new: true }
    );

    const apAccount = await ChartOfAccount.findOneAndUpdate(
      { code: 'AP-001' },
      { name: 'Accounts Payable', type: 'LIABILITY', balance: 0, isActive: true },
      { upsert: true, new: true }
    );

    const equipmentAccount = await ChartOfAccount.findOneAndUpdate(
      { code: 'FA-001' },
      { name: 'Equipment', type: 'ASSET', subType: 'fixed', balance: 0, isActive: true },
      { upsert: true, new: true }
    );

    const loanAccount = await ChartOfAccount.findOneAndUpdate(
      { code: 'LOAN-001' },
      { name: 'Bank Loan', type: 'LIABILITY', balance: 0, isActive: true },
      { upsert: true, new: true }
    );

    console.log('Accounts created');

    const today = new Date();
    let entryCounter = 1000;

    const createTransaction = async (
      date: Date,
      description: string,
      lines: Array<{ account: any; debit: number; credit: number; cashFlowCategory?: string }>
    ) => {
      const journalEntry = await JournalEntry.create({
        entryNumber: `JE-${entryCounter++}`,
        entryType: 'MANUAL',
        status: 'POSTED',
        date,
        entryDate: date,
        postingDate: date,
        periodYear: date.getFullYear(),
        periodMonth: date.getMonth() + 1,
        description,
        reference: `REF-${entryCounter}`,
        isPosted: true,
        lines: lines.map(l => ({ account: l.account._id, debit: l.debit, credit: l.credit })),
        totalDebit: lines.reduce((sum, l) => sum + l.debit, 0),
        totalCredit: lines.reduce((sum, l) => sum + l.credit, 0),
        createdBy: userId,
        approvalStatus: 'APPROVED'
      });

      for (const line of lines) {
        const prevBalance = line.account.balance || 0;
        const newBalance = prevBalance + line.debit - line.credit;
        
        await Ledger.create({
          accountId: line.account._id,
          date,
          description,
          debit: line.debit,
          credit: line.credit,
          balance: newBalance,
          journalEntryId: journalEntry._id,
          reference: `REF-${entryCounter}`,
          cashFlowCategory: line.cashFlowCategory
        });

        line.account.balance = newBalance;
        await line.account.save();
      }
    };

    for (let i = 5; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 15);

      await createTransaction(date, `Cash sales - ${date.toLocaleDateString()}`, [
        { account: cashAccount, debit: 30000, credit: 0, cashFlowCategory: 'OPERATING' },
        { account: arAccount, debit: 0, credit: 30000 }
      ]);

      await createTransaction(date, `Supplier payment - ${date.toLocaleDateString()}`, [
        { account: apAccount, debit: 15000, credit: 0 },
        { account: bankAccount, debit: 0, credit: 15000, cashFlowCategory: 'OPERATING' }
      ]);

      if (i % 3 === 0) {
        await createTransaction(date, `Equipment purchase - ${date.toLocaleDateString()}`, [
          { account: equipmentAccount, debit: 20000, credit: 0 },
          { account: bankAccount, debit: 0, credit: 20000, cashFlowCategory: 'INVESTING' }
        ]);
      }

      if (i === 4) {
        await createTransaction(date, `Bank loan received - ${date.toLocaleDateString()}`, [
          { account: bankAccount, debit: 50000, credit: 0, cashFlowCategory: 'FINANCING' },
          { account: loanAccount, debit: 0, credit: 50000 }
        ]);
      }

      if (i % 2 === 0 && i < 4) {
        await createTransaction(date, `Loan repayment - ${date.toLocaleDateString()}`, [
          { account: loanAccount, debit: 5000, credit: 0 },
          { account: bankAccount, debit: 0, credit: 5000, cashFlowCategory: 'FINANCING' }
        ]);
      }
    }

    console.log(`✅ Created ${entryCounter - 1000} journal entries with proper cash flow categories`);
    console.log('✅ Sample cash flow data seeded successfully!');

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
}

seedCashFlowData();
