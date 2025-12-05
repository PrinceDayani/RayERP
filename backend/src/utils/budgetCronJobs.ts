import cron from 'node-cron';
import { checkAllBudgets } from './budgetAlertService';

// Check all budgets every hour
export const startBudgetAlertCron = () => {
  cron.schedule('0 * * * *', async () => {
    console.log('Running budget alert check...');
    try {
      await checkAllBudgets();
      console.log('Budget alert check completed');
    } catch (error) {
      console.error('Budget alert cron error:', error);
    }
  });
  
  console.log('✅ Budget alert cron job started (runs every hour)');
};

// Daily budget summary at 9 AM
export const startBudgetSummaryCron = () => {
  cron.schedule('0 9 * * *', async () => {
    console.log('Sending daily budget summary...');
    try {
      const Budget = require('../models/Budget').default;
      const BudgetAlert = require('../models/BudgetAlert').default;
      
      const [totalBudgets, activeBudgets, activeAlerts] = await Promise.all([
        Budget.countDocuments(),
        Budget.countDocuments({ status: 'approved' }),
        BudgetAlert.countDocuments({ isActive: true, acknowledged: false })
      ]);

      console.log(`Daily Summary: ${totalBudgets} total, ${activeBudgets} active, ${activeAlerts} alerts`);
      
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
      
      console.log('Daily budget summary sent');
    } catch (error) {
      console.error('Budget summary cron error:', error);
    }
  });
  
  console.log('✅ Budget summary cron job started (runs daily at 9 AM)');
};

export default {
  startBudgetAlertCron,
  startBudgetSummaryCron
};
