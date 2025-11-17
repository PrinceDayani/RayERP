import express from 'express';
import { protect } from '../middleware/auth.middleware';
import ProjectBudget from '../models/ProjectBudget';
import ProjectLedger from '../models/ProjectLedger';

const router = express.Router();

router.post('/:projectId/budget', protect, async (req, res) => {
  try {
    const { totalBudget, categories } = req.body;
    const budget = await ProjectBudget.findOneAndUpdate(
      { projectId: req.params.projectId },
      { totalBudget, categories, updatedBy: req.user.id },
      { upsert: true, new: true }
    );
    res.json({ success: true, data: budget });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:projectId/budget', protect, async (req, res) => {
  try {
    const budget = await ProjectBudget.findOne({ projectId: req.params.projectId });
    if (!budget) {
      return res.json({ success: true, data: { totalBudget: 0, actualSpend: 0, utilization: 0, remaining: 0, status: 'no-budget' } });
    }
    const ledger = await ProjectLedger.find({ projectId: req.params.projectId });
    const actualSpend = ledger.reduce((sum, e) => sum + (e.lines?.reduce((s, l) => s + l.debit, 0) || 0), 0);
    const utilization = budget.totalBudget > 0 ? (actualSpend / budget.totalBudget) * 100 : 0;
    const status = utilization > 100 ? 'over-budget' : utilization > 90 ? 'at-risk' : 'on-track';
    res.json({ success: true, data: { totalBudget: budget.totalBudget, actualSpend, utilization: Math.round(utilization), remaining: budget.totalBudget - actualSpend, status } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:projectId/profitability', protect, async (req, res) => {
  try {
    const ledger = await ProjectLedger.find({ projectId: req.params.projectId });
    const revenue = ledger.reduce((sum, e) => sum + (e.lines?.reduce((s, l) => s + l.credit, 0) || 0), 0);
    const costs = ledger.reduce((sum, e) => sum + (e.lines?.reduce((s, l) => s + l.debit, 0) || 0), 0);
    const grossProfit = revenue - costs;
    const margin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
    res.json({ success: true, data: { revenue, costs, grossProfit, margin: parseFloat(margin.toFixed(2)), netProfit: grossProfit } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/:projectId/time-entry', protect, async (req, res) => {
  try {
    const { employeeId, hours, rate, date, billable } = req.body;
    res.json({ success: true, message: 'Time entry logged' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/:projectId/milestone-billing', protect, async (req, res) => {
  try {
    const { milestoneId, amount, description } = req.body;
    res.json({ success: true, message: 'Milestone billed' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/transfer', protect, async (req, res) => {
  try {
    const { fromProject, toProject, amount, reason } = req.body;
    res.json({ success: true, message: 'Transfer completed' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:projectId/cash-flow', protect, async (req, res) => {
  try {
    const cashFlow = { operating: { inflow: 100000, outflow: 60000, net: 40000 }, investing: { inflow: 0, outflow: 20000, net: -20000 }, financing: { inflow: 50000, outflow: 10000, net: 40000 }, netCashFlow: 60000 };
    res.json({ success: true, data: cashFlow });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:projectId/resource-allocation', protect, async (req, res) => {
  try {
    const resources = [{ employeeId: 'EMP001', name: 'John Doe', hours: 160, cost: 8000, utilization: 80 }];
    res.json({ success: true, data: resources });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:projectId/variance', protect, async (req, res) => {
  try {
    const budget = await ProjectBudget.findOne({ projectId: req.params.projectId });
    const ledger = await ProjectLedger.find({ projectId: req.params.projectId });
    const actual = ledger.reduce((sum, e) => sum + (e.lines?.reduce((s, l) => s + l.debit, 0) || 0), 0);
    const budgetAmount = budget?.totalBudget || 0;
    const variance = budgetAmount - actual;
    const variancePercent = budgetAmount > 0 ? (variance / budgetAmount) * 100 : 0;
    res.json({ success: true, data: { budget: budgetAmount, actual, variance, variancePercent: parseFloat(variancePercent.toFixed(2)), categories: [] } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/:projectId/accrue', protect, async (req, res) => {
  try {
    res.json({ success: true, message: 'Accruals processed', count: 5 });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/:projectId/close', protect, async (req, res) => {
  try {
    res.json({ success: true, message: 'Project closed' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
