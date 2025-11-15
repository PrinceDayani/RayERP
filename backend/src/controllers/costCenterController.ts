import { Request, Response } from 'express';
import { CostCenter } from '../models/CostCenter';
import { CostAllocation } from '../models/CostAllocation';
import JournalEntry from '../models/JournalEntry';
import { Voucher } from '../models/Voucher';

export const createCostCenter = async (req: Request, res: Response) => {
  try {
    const costCenter = await CostCenter.create(req.body);
    res.status(201).json({ success: true, data: costCenter });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getCostCenters = async (req: Request, res: Response) => {
  try {
    const { hierarchy, departmentId, projectId, isActive } = req.query;
    const filter: any = {};
    if (departmentId) filter.departmentId = departmentId;
    if (projectId) filter.projectId = projectId;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    let costCenters = await CostCenter.find(filter)
      .populate('departmentId', 'name')
      .populate('projectId', 'name')
      .populate('parentId', 'name code')
      .sort({ code: 1 });

    if (hierarchy === 'true') {
      costCenters = buildHierarchy(costCenters);
    }

    // Calculate actual expenses
    const centersWithActuals = await Promise.all(costCenters.map(async (cc: any) => {
      const actual = await calculateActualExpenses(cc._id);
      return { ...cc.toObject(), actual };
    }));

    res.json({ success: true, data: centersWithActuals });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCostCenterById = async (req: Request, res: Response) => {
  try {
    const costCenter = await CostCenter.findById(req.params.id)
      .populate('departmentId')
      .populate('projectId')
      .populate('parentId');
    
    if (!costCenter) {
      return res.status(404).json({ success: false, message: 'Cost center not found' });
    }

    const actual = await calculateActualExpenses(costCenter._id);
    const transactions = await getTransactions(costCenter._id);
    
    res.json({ success: true, data: { ...costCenter.toObject(), actual, transactions } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateCostCenter = async (req: Request, res: Response) => {
  try {
    const costCenter = await CostCenter.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    
    if (!costCenter) {
      return res.status(404).json({ success: false, message: 'Cost center not found' });
    }
    
    res.json({ success: true, data: costCenter });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteCostCenter = async (req: Request, res: Response) => {
  try {
    const hasChildren = await CostCenter.findOne({ parentId: req.params.id });
    if (hasChildren) {
      return res.status(400).json({ success: false, message: 'Cannot delete cost center with children' });
    }

    const hasTransactions = await JournalEntry.findOne({ costCenterId: req.params.id });
    if (hasTransactions) {
      return res.status(400).json({ success: false, message: 'Cannot delete cost center with transactions' });
    }

    await CostCenter.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Cost center deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const allocateCosts = async (req: Request, res: Response) => {
  try {
    const { sourceCostCenterId, allocationRules, amount, description } = req.body;
    
    // Validate allocation percentages sum to 100
    const totalPercentage = allocationRules.reduce((sum: number, rule: any) => sum + rule.percentage, 0);
    if (Math.abs(totalPercentage - 100) > 0.01) {
      return res.status(400).json({ success: false, message: `Allocation percentages must sum to 100% (current: ${totalPercentage}%)` });
    }
    
    const allocation = await CostAllocation.create({
      sourceCostCenterId,
      allocationRules,
      amount,
      description,
      status: 'pending'
    });

    // Create journal entries for allocation
    const entries = [];
    for (const rule of allocationRules) {
      const allocatedAmount = (amount * rule.percentage) / 100;
      entries.push({
        costCenterId: rule.targetCostCenterId,
        amount: allocatedAmount,
        type: 'allocation',
        description: `${description} - ${rule.percentage}%`
      });
    }

    allocation.status = 'completed';
    await allocation.save();

    res.json({ success: true, data: allocation, entries });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getProfitabilityReport = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, costCenterId } = req.query;
    const filter: any = { date: { $gte: new Date(startDate as string), $lte: new Date(endDate as string) } };
    if (costCenterId) filter.costCenterId = costCenterId;

    const entries = await JournalEntry.find(filter).populate('accountId');
    
    const report: any = {};
    entries.forEach((entry: any) => {
      const ccId = entry.costCenterId?.toString();
      if (!ccId) return; // Skip entries without cost center
      
      if (!report[ccId]) {
        report[ccId] = { revenue: 0, expenses: 0, profit: 0 };
      }
      
      if (entry.accountId && entry.accountId.type === 'revenue') {
        report[ccId].revenue += entry.credit || 0;
      } else if (entry.accountId && entry.accountId.type === 'expense') {
        report[ccId].expenses += entry.debit || 0;
      }
    });

    Object.keys(report).forEach(ccId => {
      report[ccId].profit = report[ccId].revenue - report[ccId].expenses;
      report[ccId].margin = report[ccId].revenue ? (report[ccId].profit / report[ccId].revenue) * 100 : 0;
    });

    res.json({ success: true, data: report });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getVarianceAnalysis = async (req: Request, res: Response) => {
  try {
    const { costCenterId, period } = req.query;
    const costCenter = await CostCenter.findById(costCenterId);
    if (!costCenter) {
      return res.status(404).json({ success: false, message: 'Cost center not found' });
    }

    const actual = await calculateActualExpenses(costCenter._id);
    const variance = costCenter.budget - actual;
    const variancePercent = costCenter.budget ? (variance / costCenter.budget) * 100 : 0;

    res.json({
      success: true,
      data: {
        budget: costCenter.budget,
        actual,
        variance,
        variancePercent,
        status: variancePercent < -10 ? 'over_budget' : variancePercent > 10 ? 'under_budget' : 'on_track'
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const transferCosts = async (req: Request, res: Response) => {
  try {
    const { fromCostCenterId, toCostCenterId, amount, description } = req.body;
    
    // Create transfer journal entry
    const entry = await JournalEntry.create({
      date: new Date(),
      description: `Cost Transfer: ${description}`,
      entries: [
        { costCenterId: fromCostCenterId, debit: 0, credit: amount },
        { costCenterId: toCostCenterId, debit: amount, credit: 0 }
      ],
      status: 'posted'
    });

    res.json({ success: true, data: entry });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const bulkImport = async (req: Request, res: Response) => {
  try {
    const { costCenters } = req.body;
    const results = await CostCenter.insertMany(costCenters, { ordered: false });
    res.json({ success: true, data: results, count: results.length });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const exportCostCenters = async (req: Request, res: Response) => {
  try {
    const costCenters = await CostCenter.find().populate('departmentId projectId parentId');
    const csv = [
      'Code,Name,Description,Budget,Budget Period,Cost Type,Department,Project,Parent,Active',
      ...costCenters.map((cc: any) => 
        `${cc.code},${cc.name},${cc.description || ''},${cc.budget || 0},${cc.budgetPeriod || 'yearly'},${cc.costType || 'direct'},${cc.departmentId?.name || ''},${cc.projectId?.name || ''},${cc.parentId?.code || ''},${cc.isActive}`
      )
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=cost-centers.csv');
    res.send(csv);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Helper functions
const buildHierarchy = (costCenters: any[]) => {
  const map = new Map();
  const roots: any[] = [];

  costCenters.forEach(cc => {
    const obj = cc.toObject ? cc.toObject() : cc;
    map.set(obj._id.toString(), { ...obj, children: [] });
  });

  costCenters.forEach(cc => {
    const obj = cc.toObject ? cc.toObject() : cc;
    const node = map.get(obj._id.toString());
    if (obj.parentId) {
      const parentId = typeof obj.parentId === 'object' ? obj.parentId._id || obj.parentId : obj.parentId;
      const parent = map.get(parentId.toString());
      if (parent) parent.children.push(node);
      else roots.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
};

const calculateActualExpenses = async (costCenterId: string) => {
  const entries = await JournalEntry.aggregate([
    { $match: { costCenterId: costCenterId, status: 'posted' } },
    { $group: { _id: null, total: { $sum: '$debit' } } }
  ]);
  return entries[0]?.total || 0;
};

const getTransactions = async (costCenterId: string) => {
  return await JournalEntry.find({ costCenterId })
    .populate('accountId', 'name code')
    .sort({ date: -1 })
    .limit(50);
};
