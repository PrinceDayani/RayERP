import cron from 'node-cron';
import axios from 'axios';
import { logger } from './logger';

const API_BASE = process.env.API_BASE_URL  || process.env.BACKEND_URL;

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

export const initializeCronJobs = () => {
  scheduleBillReminders();
  scheduleRecurringBills();
  logger.info('Cron jobs initialized');
};
