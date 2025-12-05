import { Request, Response } from 'express';
import BudgetAlert from '../models/BudgetAlert';
import { checkBudgetAlerts } from '../utils/budgetAlertService';

// Get alerts for budget
export const getBudgetAlerts = async (req: Request, res: Response) => {
  try {
    const alerts = await BudgetAlert.find({ budgetId: req.params.budgetId })
      .sort({ triggeredAt: -1 })
      .populate('acknowledgedBy', 'name email');
    
    res.json({ success: true, data: alerts });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all active alerts
export const getActiveAlerts = async (req: Request, res: Response) => {
  try {
    const alerts = await BudgetAlert.find({ isActive: true, acknowledged: false })
      .sort({ triggeredAt: -1 })
      .populate('budgetId', 'projectName departmentName totalBudget')
      .limit(50);
    
    res.json({ success: true, data: alerts });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Acknowledge alert
export const acknowledgeAlert = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const alert = await BudgetAlert.findById(req.params.alertId);
    if (!alert) {
      return res.status(404).json({ success: false, message: 'Alert not found' });
    }

    alert.acknowledged = true;
    alert.acknowledgedBy = new (require('mongoose').Types.ObjectId)(req.user.id);
    alert.acknowledgedAt = new Date();
    await alert.save();

    res.json({ success: true, data: alert, message: 'Alert acknowledged' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Manually trigger alert check
export const triggerAlertCheck = async (req: Request, res: Response) => {
  try {
    await checkBudgetAlerts(req.params.budgetId);
    res.json({ success: true, message: 'Alert check completed' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get alert statistics
export const getAlertStats = async (req: Request, res: Response) => {
  try {
    const [total, active, acknowledged, byType] = await Promise.all([
      BudgetAlert.countDocuments(),
      BudgetAlert.countDocuments({ isActive: true, acknowledged: false }),
      BudgetAlert.countDocuments({ acknowledged: true }),
      BudgetAlert.aggregate([
        { $group: { _id: '$type', count: { $sum: 1 } } }
      ])
    ]);

    res.json({
      success: true,
      data: {
        total,
        active,
        acknowledged,
        byType: byType.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {} as Record<string, number>)
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export default {
  getBudgetAlerts,
  getActiveAlerts,
  acknowledgeAlert,
  triggerAlertCheck,
  getAlertStats
};
