import cron from 'node-cron';
import { checkAllBudgets } from './budgetAlertService';
import { logger } from './logger';

// Check all budgets every hour
export const startBudgetAlertCron = () => {
  cron.schedule('0 * * * *', async () => {
    try {
      await checkAllBudgets();
    } catch (error: any) {
      logger.error('Budget alert cron error', { message: error?.message });
    }
  });
};

// Daily budget summary at 9 AM
export const startBudgetSummaryCron = () => {
  cron.schedule('0 9 * * *', async () => {
    try {
      const Budget = require('../models/Budget').default;
      const BudgetAlert = require('../models/BudgetAlert').default;
      
      const [totalBudgets, activeBudgets, activeAlerts] = await Promise.all([
        Budget.countDocuments(),
        Budget.countDocuments({ status: 'approved' }),
        BudgetAlert.countDocuments({ isActive: true, acknowledged: false })
      ]);

      // Send summary notification to admins
      const User = require('../models/User').default;
      const Notification = require('../models/Notification').default;
      
      const admins = await User.find({ 'role.name': { $in: ['Root', 'Admin', 'Director'] } });
      for (const admin of admins) {
        await Notification.create({
          userId: admin._id,
          type: 'budget_summary',
          title: 'Daily Budget Summary',
          message: `${activeBudgets} active budgets, ${activeAlerts} pending alerts`,
          priority: 'low'
        });
      }
    } catch (error: any) {
      logger.error('Budget summary cron error', { message: error?.message });
    }
  });
};

export default {
  startBudgetAlertCron,
  startBudgetSummaryCron
};
