import { AccountType } from '../models/AccountType';
import { logger } from './logger';

export async function initializeAccountTypes() {
  try {
    const defaultTypes = [
      { name: 'Asset', value: 'asset', description: 'Resources owned by the business', nature: 'debit', isSystem: true },
      { name: 'Liability', value: 'liability', description: 'Debts and obligations', nature: 'credit', isSystem: true },
      { name: 'Equity', value: 'equity', description: "Owner's equity and capital", nature: 'credit', isSystem: true },
      { name: 'Revenue', value: 'revenue', description: 'Income and sales', nature: 'credit', isSystem: true },
      { name: 'Expense', value: 'expense', description: 'Costs and expenses', nature: 'debit', isSystem: true }
    ];

    for (const type of defaultTypes) {
      const existing = await AccountType.findOne({ value: type.value });
      if (!existing) {
        await AccountType.create(type);
        logger.info(`✅ Created account type: ${type.name}`);
      }
    }

    logger.info('✅ Account types initialized');
  } catch (error: any) {
    logger.error('❌ Error initializing account types:', error.message);
  }
}
