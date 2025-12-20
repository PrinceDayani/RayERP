import ChartOfAccount from '../models/ChartOfAccount';
import { logger } from './logger';

export const ensureBasicChartOfAccounts = async (userId: string) => {
  try {
    // Check if basic accounts exist
    const existingAccounts = await ChartOfAccount.find({
      type: { $in: ['ASSET', 'REVENUE', 'LIABILITY'] },
      isActive: true
    }).lean();

    const hasAsset = existingAccounts.some(acc => acc.type === 'ASSET');
    const hasRevenue = existingAccounts.some(acc => acc.type === 'REVENUE');
    const hasLiability = existingAccounts.some(acc => acc.type === 'LIABILITY');

    const accountsToCreate = [];

    if (!hasAsset) {
      accountsToCreate.push({
        code: '1200',
        name: 'Accounts Receivable',
        type: 'ASSET',
        subType: 'Current Asset',
        category: 'Receivables',
        level: 1,
        isActive: true,
        allowPosting: true,
        createdBy: userId
      });
    }

    if (!hasRevenue) {
      accountsToCreate.push({
        code: '4000',
        name: 'Sales Revenue',
        type: 'REVENUE',
        subType: 'Operating Revenue',
        category: 'Sales',
        level: 1,
        isActive: true,
        allowPosting: true,
        createdBy: userId
      });
    }

    if (!hasLiability) {
      accountsToCreate.push({
        code: '2100',
        name: 'Tax Payable',
        type: 'LIABILITY',
        subType: 'Current Liability',
        category: 'Tax',
        level: 1,
        isActive: true,
        allowPosting: true,
        createdBy: userId
      });
    }

    if (accountsToCreate.length > 0) {
      await ChartOfAccount.insertMany(accountsToCreate);
      logger.info('Basic Chart of Accounts created', { count: accountsToCreate.length });
    }

    return true;
  } catch (error) {
    logger.error('Failed to ensure basic Chart of Accounts', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    return false;
  }
};
