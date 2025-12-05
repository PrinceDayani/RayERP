import { Request, Response } from 'express';
import Budget from '../models/Budget';

export const rolloverBudget = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { targetFiscalYear, targetFiscalPeriod, adjustmentPercentage = 0 } = req.body;
    const sourceBudget = await Budget.findById(req.params.id);

    if (!sourceBudget) {
      return res.status(404).json({ success: false, message: 'Budget not found' });
    }

    // Create new budget with rolled over data
    const rolledBudget = new Budget({
      projectId: sourceBudget.projectId,
      departmentId: sourceBudget.departmentId,
      projectName: sourceBudget.projectName,
      departmentName: sourceBudget.departmentName,
      budgetType: sourceBudget.budgetType,
      fiscalYear: targetFiscalYear,
      fiscalPeriod: targetFiscalPeriod,
      currency: sourceBudget.currency,
      totalBudget: sourceBudget.totalBudget * (1 + adjustmentPercentage / 100),
      categories: sourceBudget.categories.map(cat => ({
        name: cat.name,
        type: cat.type,
        allocatedAmount: cat.allocatedAmount * (1 + adjustmentPercentage / 100),
        spentAmount: 0,
        currency: cat.currency,
        items: cat.items.map(item => ({
          name: item.name,
          description: item.description,
          quantity: item.quantity,
          unitCost: item.unitCost * (1 + adjustmentPercentage / 100),
          totalCost: item.totalCost * (1 + adjustmentPercentage / 100)
        }))
      })),
      status: 'draft',
      createdBy: req.user.id,
      createdByDepartment: sourceBudget.createdByDepartment,
      parentBudgetId: sourceBudget._id
    });

    await rolledBudget.save();

    res.status(201).json({
      success: true,
      data: rolledBudget,
      message: 'Budget rolled over successfully'
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const bulkRollover = async (req: Request, res: Response) => {
  try {
    console.log('Bulk rollover request:', req.body);
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { sourceFiscalYear, targetFiscalYear, targetFiscalPeriod, adjustmentPercentage = 0, budgetType } = req.body;

    const filter: any = { fiscalYear: sourceFiscalYear, status: 'approved' };
    if (budgetType && budgetType !== 'all') filter.budgetType = budgetType;

    console.log('Filter:', filter);
    const sourceBudgets = await Budget.find(filter);
    console.log(`Found ${sourceBudgets.length} budgets to rollover`);
    const rolledBudgets = [];

    for (const sourceBudget of sourceBudgets) {
      const rolledBudget = new Budget({
        projectId: sourceBudget.projectId,
        departmentId: sourceBudget.departmentId,
        projectName: sourceBudget.projectName,
        departmentName: sourceBudget.departmentName,
        budgetType: sourceBudget.budgetType,
        fiscalYear: targetFiscalYear,
        fiscalPeriod: targetFiscalPeriod,
        currency: sourceBudget.currency,
        totalBudget: sourceBudget.totalBudget * (1 + adjustmentPercentage / 100),
        categories: sourceBudget.categories.map(cat => ({
          name: cat.name,
          type: cat.type,
          allocatedAmount: cat.allocatedAmount * (1 + adjustmentPercentage / 100),
          spentAmount: 0,
          currency: cat.currency,
          items: cat.items.map(item => ({
            name: item.name,
            description: item.description,
            quantity: item.quantity,
            unitCost: item.unitCost * (1 + adjustmentPercentage / 100),
            totalCost: item.totalCost * (1 + adjustmentPercentage / 100)
          }))
        })),
        status: 'draft',
        createdBy: req.user.id,
        createdByDepartment: sourceBudget.createdByDepartment,
        parentBudgetId: sourceBudget._id
      });

      await rolledBudget.save();
      rolledBudgets.push(rolledBudget);
    }

    res.status(201).json({
      success: true,
      data: rolledBudgets,
      count: rolledBudgets.length,
      message: `${rolledBudgets.length} budgets rolled over successfully`
    });
  } catch (error: any) {
    console.error('Bulk rollover error:', error);
    res.status(500).json({ success: false, message: error.message, error: error.toString() });
  }
};

export default { rolloverBudget, bulkRollover };
