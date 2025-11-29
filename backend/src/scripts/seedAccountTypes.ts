import mongoose from 'mongoose';
import { AccountType } from '../models/AccountType';
import dotenv from 'dotenv';

dotenv.config();

const defaultTypes = [
  { name: 'Asset', value: 'asset', description: 'Resources owned by the business', nature: 'debit', isSystem: true },
  { name: 'Liability', value: 'liability', description: 'Debts and obligations', nature: 'credit', isSystem: true },
  { name: 'Equity', value: 'equity', description: 'Owner\'s equity and capital', nature: 'credit', isSystem: true },
  { name: 'Revenue', value: 'revenue', description: 'Income and sales', nature: 'credit', isSystem: true },
  { name: 'Expense', value: 'expense', description: 'Costs and expenses', nature: 'debit', isSystem: true }
];

async function seedAccountTypes() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/rayerp');
    console.log('Connected to MongoDB');

    for (const type of defaultTypes) {
      const existing = await AccountType.findOne({ value: type.value });
      if (!existing) {
        await AccountType.create(type);
        console.log(`Created account type: ${type.name}`);
      } else {
        console.log(`Account type already exists: ${type.name}`);
      }
    }

    console.log('Account types seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding account types:', error);
    process.exit(1);
  }
}

seedAccountTypes();
