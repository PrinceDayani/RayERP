import { Request, Response } from 'express';
import { CostCenter } from '../models/CostCenter';
import { JournalEntry } from '../models/JournalEntry';

export const costCenterController = {
  // Get all cost centers
  async getAll(req: Request, res: Response) {
    try {
      const { type, projectId } = req.query;
      const filter: any = { isActive: true };
      
      if (type) filter.type = type;
      if (projectId) filter.projectId = projectId;
      
      const costCenters = await CostCenter.find(filter)
        .populate('parentId', 'name code')
        .populate('projectId', 'name')
        .populate('manager', 'name email')
        .sort({ code: 1 });
      
      res.json(costCenters);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch cost centers' });
    }
  },

  // Create new cost center
  async create(req: Request, res: Response) {
    try {
      const costCenter = new CostCenter(req.body);
      await costCenter.save();
      
      await costCenter.populate('manager', 'name email');
      res.status(201).json(costCenter);
    } catch (error) {
      res.status(400).json({ error: 'Failed to create cost center' });
    }
  },

  // Update cost center
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const costCenter = await CostCenter.findByIdAndUpdate(
        id, 
        req.body, 
        { new: true, runValidators: true }
      ).populate('manager', 'name email');
      
      if (!costCenter) {
        return res.status(404).json({ error: 'Cost center not found' });
      }
      
      res.json(costCenter);
    } catch (error) {
      res.status(400).json({ error: 'Failed to update cost center' });
    }
  },

  // Get cost center budget vs actual
  async getBudgetAnalysis(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { fromDate, toDate } = req.query;
      
      const costCenter = await CostCenter.findById(id);
      if (!costCenter) {
        return res.status(404).json({ error: 'Cost center not found' });
      }

      // Calculate actual costs from journal entries
      const dateFilter: any = {};
      if (fromDate) dateFilter.$gte = new Date(fromDate as string);
      if (toDate) dateFilter.$lte = new Date(toDate as string);

      const journalEntries = await JournalEntry.find({
        'lines.costCenterId': id,
        isPosted: true,
        ...(Object.keys(dateFilter).length > 0 && { date: dateFilter })
      });

      let actualCostByCategory = {
        material: 0,
        labour: 0,
        equipment: 0,
        subcontractor: 0,
        overhead: 0
      };

      journalEntries.forEach(entry => {
        entry.lines.forEach(line => {
          if (line.costCenterId?.toString() === id && line.costHead) {
            actualCostByCategory[line.costHead] += line.debit;
          }
        });
      });

      const totalActualCost = Object.values(actualCostByCategory).reduce((sum, cost) => sum + cost, 0);
      const variance = costCenter.budget - totalActualCost - costCenter.committedCost;
      const utilizationPercent = costCenter.budget > 0 ? (totalActualCost / costCenter.budget) * 100 : 0;

      res.json({
        costCenter: {
          id: costCenter._id,
          name: costCenter.name,
          code: costCenter.code,
          type: costCenter.type
        },
        budget: costCenter.budget,
        actualCost: totalActualCost,
        committedCost: costCenter.committedCost,
        variance,
        utilizationPercent,
        costByCategory: actualCostByCategory,
        period: { fromDate, toDate }
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch budget analysis' });
    }
  },

  // Get cost center hierarchy
  async getHierarchy(req: Request, res: Response) {
    try {
      const costCenters = await CostCenter.find({ isActive: true })
        .populate('manager', 'name')
        .sort({ code: 1 });
      
      // Build hierarchy tree
      const buildTree = (parentId: string | null = null): any[] => {
        return costCenters
          .filter(cc => (parentId ? cc.parentId?.toString() === parentId : !cc.parentId))
          .map(cc => ({
            ...cc.toObject(),
            children: buildTree(cc._id.toString())
          }));
      };
      
      const hierarchy = buildTree();
      res.json(hierarchy);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch cost center hierarchy' });
    }
  },

  // Get cost centers by project
  async getByProject(req: Request, res: Response) {
    try {
      const { projectId } = req.params;
      
      const costCenters = await CostCenter.find({ 
        projectId, 
        isActive: true 
      })
        .populate('manager', 'name email')
        .sort({ code: 1 });
      
      res.json(costCenters);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch project cost centers' });
    }
  },

  // Update actual costs (called from journal posting)
  async updateActualCosts(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { amount, operation } = req.body; // operation: 'add' or 'subtract'
      
      const costCenter = await CostCenter.findById(id);
      if (!costCenter) {
        return res.status(404).json({ error: 'Cost center not found' });
      }

      if (operation === 'add') {
        costCenter.actualCost += amount;
      } else if (operation === 'subtract') {
        costCenter.actualCost = Math.max(0, costCenter.actualCost - amount);
      }

      await costCenter.save();
      res.json(costCenter);
    } catch (error) {
      res.status(400).json({ error: 'Failed to update actual costs' });
    }
  }
};