import { Currency } from '../models/Currency';
import { logger } from './logger';

export const seedDefaultCurrencies = async () => {
  try {
    // Check if currencies already exist
    const existingCurrencies = await Currency.countDocuments();
    if (existingCurrencies > 0) {
      logger.info('✅ Currencies already exist, skipping seed');
      return;
    }

    const defaultCurrencies = [
      {
        code: 'USD',
        name: 'US Dollar',
        symbol: '$',
        isBaseCurrency: false
      },
      {
        code: 'EUR',
        name: 'Euro',
        symbol: '€',
        isBaseCurrency: false
      },
      {
        code: 'GBP',
        name: 'British Pound',
        symbol: '£',
        isBaseCurrency: false
      },
      {
        code: 'INR',
        name: 'Indian Rupee',
        symbol: '₹',
        isBaseCurrency: true
      }
    ];

    await Currency.insertMany(defaultCurrencies);
    logger.info('✅ Default currencies seeded successfully');
  } catch (error) {
    logger.warn('⚠️ Failed to seed default currencies:', error.message);
  }
};