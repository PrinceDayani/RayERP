import mongoose from 'mongoose';
import ChartOfAccount from '../models/ChartOfAccount';

const defaultAccounts = [
  // Assets
  { accountCode: '1100', accountName: 'Cash', accountType: 'ASSET', parentAccount: null, isActive: true },
  { accountCode: '1200', accountName: 'Accounts Receivable', accountType: 'ASSET', parentAccount: null, isActive: true },
  { accountCode: '1300', accountName: 'Inventory', accountType: 'ASSET', parentAccount: null, isActive: true },
  
  // Liabilities
  { accountCode: '2100', accountName: 'Accounts Payable', accountType: 'LIABILITY', parentAccount: null, isActive: true },
  { accountCode: '2300', accountName: 'Tax Payable', accountType: 'LIABILITY', parentAccount: null, isActive: true },
  
  // Equity
  { accountCode: '3100', accountName: 'Owner Equity', accountType: 'EQUITY', parentAccount: null, isActive: true },
  
  // Revenue
  { accountCode: '4000', accountName: 'Sales Revenue', accountType: 'REVENUE', parentAccount: null, isActive: true },
  { accountCode: '4100', accountName: 'Service Revenue', accountType: 'REVENUE', parentAccount: null, isActive: true },
  
  // Expenses
  { accountCode: '5000', accountName: 'Cost of Goods Sold', accountType: 'EXPENSE', parentAccount: null, isActive: true },
  { accountCode: '6000', accountName: 'Operating Expenses', accountType: 'EXPENSE', parentAccount: null, isActive: true },
  { accountCode: '6100', accountName: 'Office Supplies', accountType: 'EXPENSE', parentAccount: null, isActive: true },
  { accountCode: '6200', accountName: 'Rent Expense', accountType: 'EXPENSE', parentAccount: null, isActive: true }
];

export const seedDefaultAccounts = async () => {
  try {
    console.log('Seeding default chart of accounts...');
    
    for (const accountData of defaultAccounts) {
      const existingAccount = await ChartOfAccount.findOne({ accountCode: accountData.accountCode });
      
      if (!existingAccount) {
        const account = new ChartOfAccount(accountData);
        await account.save();
        console.log(`Created account: ${accountData.accountCode} - ${accountData.accountName}`);
      } else {
        console.log(`Account already exists: ${accountData.accountCode} - ${accountData.accountName}`);
      }
    }
    
    console.log('Default accounts seeding completed');
  } catch (error) {
    console.error('Error seeding default accounts:', error);
    throw error;
  }
};

export default seedDefaultAccounts;
