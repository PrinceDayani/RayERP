import { Account } from '../models/Account';
import ChartOfAccount from '../models/ChartOfAccount';
import { logger } from './logger';

export const initializeCompleteFinanceSystem = async () => {
  try {
    logger.info('🏦 Initializing Complete Finance System...');

    // Create default chart of accounts
    await createDefaultChartOfAccounts();
    
    // Create default accounts
    await createDefaultAccounts();
    
    logger.info('✅ Complete Finance System initialized successfully');
  } catch (error) {
    logger.error('❌ Error initializing Complete Finance System:', error);
    throw error;
  }
};

const createDefaultChartOfAccounts = async () => {
  const defaultAccounts = [
    // Assets
    { code: '1000', name: 'Cash', type: 'ASSET', category: 'Current Assets', level: 1 },
    { code: '1100', name: 'Bank Account', type: 'ASSET', category: 'Current Assets', level: 1 },
    { code: '1200', name: 'Accounts Receivable', type: 'ASSET', category: 'Current Assets', level: 1 },
    { code: '1300', name: 'Inventory', type: 'ASSET', category: 'Current Assets', level: 1 },
    { code: '1400', name: 'Prepaid Expenses', type: 'ASSET', category: 'Current Assets', level: 1 },
    { code: '1500', name: 'Fixed Assets', type: 'ASSET', category: 'Non-Current Assets', level: 1 },
    { code: '1600', name: 'Accumulated Depreciation', type: 'ASSET', category: 'Non-Current Assets', level: 1 },

    // Liabilities
    { code: '2000', name: 'Accounts Payable', type: 'LIABILITY', category: 'Current Liabilities', level: 1 },
    { code: '2100', name: 'Accrued Expenses', type: 'LIABILITY', category: 'Current Liabilities', level: 1 },
    { code: '2200', name: 'Short-term Loans', type: 'LIABILITY', category: 'Current Liabilities', level: 1 },
    { code: '2300', name: 'Tax Payable', type: 'LIABILITY', category: 'Current Liabilities', level: 1 },
    { code: '2400', name: 'Long-term Debt', type: 'LIABILITY', category: 'Non-Current Liabilities', level: 1 },

    // Equity
    { code: '3000', name: 'Owner\'s Equity', type: 'EQUITY', category: 'Equity', level: 1 },
    { code: '3100', name: 'Retained Earnings', type: 'EQUITY', category: 'Equity', level: 1 },
    { code: '3200', name: 'Capital', type: 'EQUITY', category: 'Equity', level: 1 },

    // Revenue
    { code: '4000', name: 'Sales Revenue', type: 'REVENUE', category: 'Operating Revenue', level: 1 },
    { code: '4100', name: 'Service Revenue', type: 'REVENUE', category: 'Operating Revenue', level: 1 },
    { code: '4200', name: 'Other Income', type: 'REVENUE', category: 'Non-Operating Revenue', level: 1 },
    { code: '4300', name: 'Interest Income', type: 'REVENUE', category: 'Non-Operating Revenue', level: 1 },

    // Expenses
    { code: '5000', name: 'Cost of Goods Sold', type: 'EXPENSE', category: 'Direct Expenses', level: 1 },
    { code: '5100', name: 'Salaries and Wages', type: 'EXPENSE', category: 'Operating Expenses', level: 1 },
    { code: '5200', name: 'Rent Expense', type: 'EXPENSE', category: 'Operating Expenses', level: 1 },
    { code: '5300', name: 'Utilities Expense', type: 'EXPENSE', category: 'Operating Expenses', level: 1 },
    { code: '5400', name: 'Office Supplies', type: 'EXPENSE', category: 'Operating Expenses', level: 1 },
    { code: '5500', name: 'Marketing Expense', type: 'EXPENSE', category: 'Operating Expenses', level: 1 },
    { code: '5600', name: 'Travel Expense', type: 'EXPENSE', category: 'Operating Expenses', level: 1 },
    { code: '5700', name: 'Professional Fees', type: 'EXPENSE', category: 'Operating Expenses', level: 1 },
    { code: '5800', name: 'Depreciation Expense', type: 'EXPENSE', category: 'Operating Expenses', level: 1 },
    { code: '5900', name: 'Interest Expense', type: 'EXPENSE', category: 'Non-Operating Expenses', level: 1 }
  ];

  const systemUserId = '000000000000000000000000'; // Default system user ID

  for (const accountData of defaultAccounts) {
    const existingAccount = await ChartOfAccount.findOne({ code: accountData.code });
    if (!existingAccount) {
      await ChartOfAccount.create({
        ...accountData,
        isActive: true,
        allowPosting: true,
        currency: 'INR',
        createdBy: systemUserId
      });
      logger.info(`✅ Created chart of account: ${accountData.code} - ${accountData.name}`);
    }
  }
};

const createDefaultAccounts = async () => {
  const defaultAccounts = [
    // Assets
    { code: '1000', name: 'Cash', type: 'asset', subType: 'current', category: 'cash' },
    { code: '1100', name: 'Bank Account', type: 'asset', subType: 'current', category: 'bank' },
    { code: '1200', name: 'Accounts Receivable', type: 'asset', subType: 'current', category: 'receivables' },
    { code: '1300', name: 'Inventory', type: 'asset', subType: 'current', category: 'inventory' },
    { code: '1500', name: 'Fixed Assets', type: 'asset', subType: 'fixed', category: 'equipment' },

    // Liabilities
    { code: '2000', name: 'Accounts Payable', type: 'liability', subType: 'current', category: 'payables' },
    { code: '2100', name: 'Accrued Expenses', type: 'liability', subType: 'current', category: 'accrued' },
    { code: '2300', name: 'Tax Payable', type: 'liability', subType: 'current', category: 'tax' },

    // Equity
    { code: '3000', name: 'Owner\'s Equity', type: 'equity', subType: 'capital', category: 'equity' },
    { code: '3100', name: 'Retained Earnings', type: 'equity', subType: 'retained', category: 'earnings' },

    // Revenue
    { code: '4000', name: 'Sales Revenue', type: 'revenue', subType: 'operating', category: 'sales' },
    { code: '4100', name: 'Service Revenue', type: 'revenue', subType: 'operating', category: 'services' },

    // Expenses
    { code: '5000', name: 'Cost of Goods Sold', type: 'expense', subType: 'direct', category: 'cogs' },
    { code: '5100', name: 'Salaries and Wages', type: 'expense', subType: 'operating', category: 'payroll' },
    { code: '5200', name: 'Rent Expense', type: 'expense', subType: 'operating', category: 'rent' },
    { code: '5300', name: 'Utilities Expense', type: 'expense', subType: 'operating', category: 'utilities' }
  ];

  const systemUserId = '000000000000000000000000'; // Default system user ID

  for (const accountData of defaultAccounts) {
    const existingAccount = await Account.findOne({ code: accountData.code });
    if (!existingAccount) {
      await Account.create({
        ...accountData,
        balance: 0,
        openingBalance: 0,
        currency: 'INR',
        isActive: true,
        isGroup: false,
        allowPosting: true,
        level: 1,
        createdBy: systemUserId
      });
      logger.info(`✅ Created account: ${accountData.code} - ${accountData.name}`);
    }
  }
};

export default initializeCompleteFinanceSystem;