import mongoose from 'mongoose';
import ChartOfAccount from '../models/ChartOfAccount';
import User from '../models/User';

const defaultAccounts = [
  // Assets
  { code: '1100', name: 'Cash', type: 'ASSET', isActive: true },
  { code: '1200', name: 'Accounts Receivable', type: 'ASSET', isActive: true },
  { code: '1300', name: 'Inventory', type: 'ASSET', isActive: true },
  
  // Liabilities
  { code: '2100', name: 'Accounts Payable', type: 'LIABILITY', isActive: true },
  { code: '2300', name: 'Tax Payable', type: 'LIABILITY', isActive: true },
  
  // Equity
  { code: '3100', name: 'Owner Equity', type: 'EQUITY', isActive: true },
  
  // Revenue
  { code: '4000', name: 'Sales Revenue', type: 'REVENUE', isActive: true },
  { code: '4100', name: 'Service Revenue', type: 'REVENUE', isActive: true },
  
  // Expenses
  { code: '5000', name: 'Cost of Goods Sold', type: 'EXPENSE', isActive: true },
  { code: '6000', name: 'Operating Expenses', type: 'EXPENSE', isActive: true },
  { code: '6100', name: 'Office Supplies', type: 'EXPENSE', isActive: true },
  { code: '6200', name: 'Rent Expense', type: 'EXPENSE', isActive: true }
];

export const seedDefaultAccounts = async () => {
  try {
    console.log('Seeding default chart of accounts...');
    
    // Get system user for createdBy field
    const systemUser = await User.findOne({ email: 'admin@rayerp.com' }) || await User.findOne().sort({ createdAt: 1 });
    
    if (!systemUser) {
      console.log('No user found, skipping chart of accounts seeding');
      return;
    }
    
    for (const accountData of defaultAccounts) {
      const existingAccount = await ChartOfAccount.findOne({ code: accountData.code });
      
      if (!existingAccount) {
        const account = new ChartOfAccount({
          ...accountData,
          createdBy: systemUser._id
        });
        await account.save();
        console.log(`Created account: ${accountData.code} - ${accountData.name}`);
      } else {
        console.log(`Account already exists: ${accountData.code} - ${accountData.name}`);
      }
    }
    
    console.log('Default accounts seeding completed');
  } catch (error) {
    console.error('Error seeding default accounts:', error);
  }
};

export default seedDefaultAccounts;
