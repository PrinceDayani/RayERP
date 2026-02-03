import mongoose from 'mongoose';
import ChartOfAccount from '../models/ChartOfAccount';
import { logger } from '../utils/logger';

/**
 * Migration script to categorize accounts for improved P&L reporting
 * Run this once to update existing accounts with proper subType values
 */

const accountCategories = [
  // Revenue accounts
  { pattern: /sales|revenue|income from sales/i, type: 'revenue', subType: 'sales', category: 'Sales Revenue' },
  { pattern: /service|consulting|professional fees/i, type: 'revenue', subType: 'service', category: 'Service Revenue' },
  { pattern: /other income|miscellaneous income|interest income/i, type: 'revenue', subType: 'other_income', category: 'Other Income' },
  
  // COGS accounts
  { pattern: /cost of goods|cogs|direct material|direct labor|raw material|manufacturing/i, type: 'expense', subType: 'cogs', category: 'Cost of Goods Sold' },
  { pattern: /purchase|inventory cost|production cost/i, type: 'expense', subType: 'cogs', category: 'Cost of Goods Sold' },
  
  // Operating expenses
  { pattern: /salary|wage|payroll|compensation|employee/i, type: 'expense', subType: 'operating', category: 'Personnel Costs' },
  { pattern: /rent|lease|facility/i, type: 'expense', subType: 'operating', category: 'Occupancy Costs' },
  { pattern: /utility|electricity|water|internet|phone/i, type: 'expense', subType: 'operating', category: 'Utilities' },
  { pattern: /marketing|advertising|promotion/i, type: 'expense', subType: 'operating', category: 'Marketing & Sales' },
  { pattern: /office|supplies|stationery/i, type: 'expense', subType: 'operating', category: 'Office Expenses' },
  { pattern: /travel|transportation|vehicle/i, type: 'expense', subType: 'operating', category: 'Travel & Transport' },
  { pattern: /insurance|legal|professional fees|consulting/i, type: 'expense', subType: 'operating', category: 'Professional Services' },
  { pattern: /repair|maintenance/i, type: 'expense', subType: 'operating', category: 'Repairs & Maintenance' },
  
  // Depreciation
  { pattern: /depreciation|amortization/i, type: 'expense', subType: 'depreciation', category: 'Depreciation & Amortization' },
  
  // Interest
  { pattern: /interest expense|interest paid|finance charge/i, type: 'expense', subType: 'interest', category: 'Interest Expense' },
  
  // Tax
  { pattern: /tax|income tax|gst|vat|tds/i, type: 'expense', subType: 'tax', category: 'Tax Expense' }
];

export const migrateAccountCategories = async () => {
  try {
    logger.info('Starting account categorization migration...');
    
    const accounts = await ChartOfAccount.find({ isActive: true });
    let updated = 0;
    let skipped = 0;

    for (const account of accounts) {
      // Skip if already has subType
      if (account.subType && account.subType !== '') {
        skipped++;
        continue;
      }

      // Find matching category
      const match = accountCategories.find(cat => 
        cat.type === account.type && cat.pattern.test(account.name)
      );

      if (match) {
        await ChartOfAccount.updateOne(
          { _id: account._id },
          { 
            $set: { 
              subType: match.subType,
              category: match.category
            } 
          }
        );
        updated++;
        logger.info(`Updated: ${account.code} - ${account.name} -> ${match.subType}`);
      } else {
        // Set default subType based on account type
        let defaultSubType = '';
        let defaultCategory = '';
        
        if (account.type === 'REVENUE') {
          defaultSubType = 'other_income';
          defaultCategory = 'Other Income';
        } else if (account.type === 'EXPENSE') {
          defaultSubType = 'operating';
          defaultCategory = 'Other Operating Expenses';
        }

        if (defaultSubType) {
          await ChartOfAccount.updateOne(
            { _id: account._id },
            { 
              $set: { 
                subType: defaultSubType,
                category: defaultCategory
              } 
            }
          );
          updated++;
          logger.info(`Default: ${account.code} - ${account.name} -> ${defaultSubType}`);
        }
      }
    }

    logger.info(`Migration complete: ${updated} updated, ${skipped} skipped`);
    return { success: true, updated, skipped };
  } catch (error: any) {
    logger.error('Migration error:', error);
    throw error;
  }
};

// Run migration if called directly
if (require.main === module) {
  const dotenv = require('dotenv');
  const path = require('path');
  dotenv.config({ path: path.resolve(__dirname, '../../.env') });
  
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/rayerp';
  
  console.log('🔗 Connecting to MongoDB...');
  mongoose.connect(MONGO_URI)
    .then(async () => {
      console.log('✅ Connected to MongoDB');
      await migrateAccountCategories();
      await mongoose.disconnect();
      console.log('✅ Disconnected from MongoDB');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Connection error:', error.message);
      process.exit(1);
    });
}

