import mongoose from 'mongoose';
import { Account } from '../models/Account';
import { Ledger } from '../models/Ledger';

const seedCashFlowData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/rayerp');
    console.log('Connected to MongoDB');

    const cashAccount = await Account.findOneAndUpdate(
      { code: '1010' },
      { name: 'Cash & Bank', code: '1010', type: 'asset', subType: 'cash', isActive: true },
      { upsert: true, new: true }
    );

    const salesAccount = await Account.findOneAndUpdate(
      { code: '4100' },
      { name: 'Sales Revenue', code: '4100', type: 'revenue', isActive: true },
      { upsert: true, new: true }
    );

    const cogsAccount = await Account.findOneAndUpdate(
      { code: '5100' },
      { name: 'Cost of Goods Sold', code: '5100', type: 'expense', isActive: true },
      { upsert: true, new: true }
    );

    const salariesAccount = await Account.findOneAndUpdate(
      { code: '5200' },
      { name: 'Salaries & Wages', code: '5200', type: 'expense', isActive: true },
      { upsert: true, new: true }
    );

    const rentAccount = await Account.findOneAndUpdate(
      { code: '5300' },
      { name: 'Rent Expense', code: '5300', type: 'expense', isActive: true },
      { upsert: true, new: true }
    );

    const equipmentAccount = await Account.findOneAndUpdate(
      { code: '1600' },
      { name: 'Equipment', code: '1600', type: 'asset', subType: 'fixed', isActive: true },
      { upsert: true, new: true }
    );

    const loanAccount = await Account.findOneAndUpdate(
      { code: '2100' },
      { name: 'Long-term Loan', code: '2100', type: 'liability', isActive: true },
      { upsert: true, new: true }
    );

    const equityAccount = await Account.findOneAndUpdate(
      { code: '3100' },
      { name: 'Owner Equity', code: '3100', type: 'equity', isActive: true },
      { upsert: true, new: true }
    );

    console.log('Accounts created');

    await Ledger.deleteMany({});
    const currentYear = new Date().getFullYear();
    const entries = [];

    // Monthly sales revenue (Operating Inflows)
    for (let month = 0; month < 12; month++) {
      entries.push({
        accountId: salesAccount._id,
        date: new Date(currentYear, month, 15),
        description: `Sales - ${new Date(currentYear, month).toLocaleString('default', { month: 'long' })}`,
        debit: 0,
        credit: 80000 + Math.random() * 40000,
        reference: `SAL-${currentYear}${String(month + 1).padStart(2, '0')}`
      });
    }

    // Monthly COGS (Operating Outflows)
    for (let month = 0; month < 12; month++) {
      entries.push({
        accountId: cogsAccount._id,
        date: new Date(currentYear, month, 16),
        description: `COGS - ${new Date(currentYear, month).toLocaleString('default', { month: 'long' })}`,
        debit: 40000 + Math.random() * 15000,
        credit: 0,
        reference: `COGS-${currentYear}${String(month + 1).padStart(2, '0')}`
      });
    }

    // Monthly salaries (Operating Outflows)
    for (let month = 0; month < 12; month++) {
      entries.push({
        accountId: salariesAccount._id,
        date: new Date(currentYear, month, 25),
        description: `Salaries - ${new Date(currentYear, month).toLocaleString('default', { month: 'long' })}`,
        debit: 25000,
        credit: 0,
        reference: `SAL-${currentYear}${String(month + 1).padStart(2, '0')}`
      });
    }

    // Monthly rent (Operating Outflows)
    for (let month = 0; month < 12; month++) {
      entries.push({
        accountId: rentAccount._id,
        date: new Date(currentYear, month, 1),
        description: `Rent - ${new Date(currentYear, month).toLocaleString('default', { month: 'long' })}`,
        debit: 15000,
        credit: 0,
        reference: `RENT-${currentYear}${String(month + 1).padStart(2, '0')}`
      });
    }

    // Equipment purchases (Investing Outflows)
    entries.push(
      {
        accountId: equipmentAccount._id,
        date: new Date(currentYear, 2, 10),
        description: 'Computer equipment purchase',
        debit: 50000,
        credit: 0,
        reference: 'INV-EQ-001'
      },
      {
        accountId: equipmentAccount._id,
        date: new Date(currentYear, 7, 20),
        description: 'Office furniture purchase',
        debit: 30000,
        credit: 0,
        reference: 'INV-EQ-002'
      }
    );

    // Loan received (Financing Inflow)
    entries.push({
      accountId: loanAccount._id,
      date: new Date(currentYear, 1, 5),
      description: 'Bank loan received',
      debit: 0,
      credit: 200000,
      reference: 'LOAN-IN-001'
    });

    // Loan repayments (Financing Outflows)
    for (let month = 3; month < 12; month++) {
      entries.push({
        accountId: loanAccount._id,
        date: new Date(currentYear, month, 10),
        description: `Loan repayment - ${new Date(currentYear, month).toLocaleString('default', { month: 'long' })}`,
        debit: 10000,
        credit: 0,
        reference: `LOAN-PAY-${String(month + 1).padStart(2, '0')}`
      });
    }

    // Owner investment (Financing Inflow)
    entries.push({
      accountId: equityAccount._id,
      date: new Date(currentYear, 0, 1),
      description: 'Initial capital investment',
      debit: 0,
      credit: 500000,
      reference: 'EQ-INV-001'
    });

    await Ledger.insertMany(entries);
    console.log(`✅ Created ${entries.length} ledger entries`);
    console.log('✅ Cash flow data seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedCashFlowData();
