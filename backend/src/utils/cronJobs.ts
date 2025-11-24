import cron from 'node-cron';
import axios from 'axios';
import { logger } from './logger';
import { RecurringEntry } from '../models/RecurringEntry';
import JournalEntry from '../models/JournalEntry';

const API_BASE = process.env.API_BASE_URL || process.env.BACKEND_URL || 'http://localhost:5000';

const calculateNextRunDate = (startDate: Date, frequency: string): Date => {
  const next = new Date(startDate);
  switch (frequency) {
    case 'daily': next.setDate(next.getDate() + 1); break;
    case 'weekly': next.setDate(next.getDate() + 7); break;
    case 'monthly': next.setMonth(next.getMonth() + 1); break;
    case 'quarterly': next.setMonth(next.getMonth() + 3); break;
    case 'yearly': next.setFullYear(next.getFullYear() + 1); break;
  }
  return next;
};

export const scheduleBillReminders = () => {
  cron.schedule('0 9 * * *', async () => {
    try {
      logger.info('Running bill reminders');
      await axios.post(`${API_BASE}/api/bills/reminders/send`);
    } catch (error) {
      logger.error('Bill reminders error:', error);
    }
  });
};

export const scheduleRecurringBills = () => {
  cron.schedule('0 1 * * *', async () => {
    try {
      logger.info('Processing recurring bills');
      await axios.post(`${API_BASE}/api/bills/recurring/process`);
    } catch (error) {
      logger.error('Recurring bills error:', error);
    }
  });
};

export const scheduleRecurringEntries = () => {
  // Run every hour to check for recurring entries
  cron.schedule('0 * * * *', async () => {
    try {
      logger.info('Processing recurring journal entries');
      const today = new Date();
      const entries = await RecurringEntry.find({
        isActive: true,
        nextRunDate: { $lte: today },
        $or: [{ endDate: { $exists: false } }, { endDate: { $gte: today } }]
      }).populate('entries.accountId');

      let processed = 0;
      for (const entry of entries) {
        try {
          await JournalEntry.create({
            date: today,
            description: `${entry.name} - Auto-generated`,
            reference: `REC-${entry._id}`,
            entries: entry.entries.map(e => ({
              accountId: e.accountId,
              debit: e.debit,
              credit: e.credit,
              description: e.description
            })),
            createdBy: entry.createdBy,
            status: 'posted'
          });

          entry.lastRunDate = today;
          entry.nextRunDate = calculateNextRunDate(today, entry.frequency);
          await entry.save();
          processed++;
        } catch (error) {
          logger.error(`Error processing recurring entry ${entry._id}:`, error);
        }
      }
      
      if (processed > 0) {
        logger.info(`✅ Processed ${processed} recurring entries`);
      }
    } catch (error) {
      logger.error('Recurring entries processing error:', error);
    }
  });
};

export const initializeCronJobs = () => {
  scheduleBillReminders();
  scheduleRecurringBills();
  scheduleRecurringEntries();
  logger.info('✅ Cron jobs initialized (bills, recurring entries)');
};
