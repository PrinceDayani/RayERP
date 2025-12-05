import Budget from '../models/Budget';
import BudgetAlert from '../models/BudgetAlert';
import Notification from '../models/Notification';

export const checkBudgetAlerts = async (budgetId: string) => {
  try {
    const budget = await Budget.findById(budgetId).populate('createdByDepartment');
    if (!budget || budget.status !== 'approved') return;

    // Utilization is calculated from actualSpent / totalBudget in Budget model
    const utilization = budget.utilizationPercentage;
    const existingAlerts = await BudgetAlert.find({ budgetId, isActive: true });

    // Warning at 80%
    if (utilization >= 80 && utilization < 90) {
      const hasWarning = existingAlerts.some(a => a.type === 'warning');
      if (!hasWarning) {
        await createAlert(budget, 'warning', 80, utilization);
      }
    }

    // Alert at 90%
    if (utilization >= 90 && utilization < 100) {
      const hasAlert = existingAlerts.some(a => a.type === 'alert');
      if (!hasAlert) {
        await createAlert(budget, 'alert', 90, utilization);
      }
    }

    // Critical at 100%
    if (utilization >= 100) {
      const hasCritical = existingAlerts.some(a => a.type === 'critical');
      if (!hasCritical) {
        await createAlert(budget, 'critical', 100, utilization);
      }
    }
  } catch (error) {
    console.error('Error checking budget alerts:', error);
  }
};

const createAlert = async (budget: any, type: string, threshold: number, utilization: number) => {
  const messages = {
    warning: `Budget "${budget.projectName || budget.departmentName}" has reached ${utilization.toFixed(1)}% utilization`,
    alert: `Budget "${budget.projectName || budget.departmentName}" is at ${utilization.toFixed(1)}% - Action required`,
    critical: `Budget "${budget.projectName || budget.departmentName}" has exceeded 100% - CRITICAL`
  };

  const alert = new BudgetAlert({
    budgetId: budget._id,
    type,
    threshold,
    currentUtilization: utilization,
    message: messages[type as keyof typeof messages],
    notifiedUsers: []
  });

  await alert.save();

  // Create notifications
  const User = require('../models/User').default;
  const Department = require('../models/Department').default;

  // Notify department members
  if (budget.createdByDepartment) {
    const dept = await Department.findById(budget.createdByDepartment);
    if (dept) {
      const deptUsers = await User.find({ department: dept._id });
      for (const user of deptUsers) {
        await Notification.create({
          userId: user._id,
          type: 'budget_alert',
          title: `Budget Alert: ${type.toUpperCase()}`,
          message: alert.message,
          priority: type === 'critical' ? 'high' : type === 'alert' ? 'medium' : 'low',
          relatedId: budget._id,
          relatedModel: 'Budget'
        });
        alert.notifiedUsers.push(user._id);
      }
    }
  }

  // Notify managers and directors for critical alerts
  if (type === 'critical' || type === 'alert') {
    const managers = await User.find({ 'role.name': { $in: ['Manager', 'Director', 'CFO'] } });
    for (const manager of managers) {
      if (!alert.notifiedUsers.includes(manager._id)) {
        await Notification.create({
          userId: manager._id,
          type: 'budget_alert',
          title: `Budget Alert: ${type.toUpperCase()}`,
          message: alert.message,
          priority: 'high',
          relatedId: budget._id,
          relatedModel: 'Budget'
        });
        alert.notifiedUsers.push(manager._id);
      }
    }
  }

  await alert.save();

  // Emit socket event
  try {
    const { io } = await import('../server');
    io.emit('budget:alert', { budgetId: budget._id, alert });
  } catch (error) {
    console.error('Socket emit error:', error);
  }
};

export const checkAllBudgets = async () => {
  try {
    const budgets = await Budget.find({ status: 'approved' });
    for (const budget of budgets) {
      await checkBudgetAlerts(budget._id.toString());
    }
  } catch (error) {
    console.error('Error checking all budgets:', error);
  }
};

export default {
  checkBudgetAlerts,
  checkAllBudgets
};
