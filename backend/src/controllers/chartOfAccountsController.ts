import { Request, Response } from 'express';
import { ChartOfAccounts } from '../models/ChartOfAccounts';
import { CostCenter } from '../models/CostCenter';

export const chartOfAccountsController = {
  // Get all accounts with hierarchy
  async getAll(req: Request, res: Response) {
    try {
      const accounts = await ChartOfAccounts.find({ isActive: true })
        .populate('parentId', 'name code')
        .populate('costCenterIds', 'name code')
        .sort({ code: 1 });
      
      res.json(accounts);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch chart of accounts' });
    }
  },

  // Create new account
  async create(req: Request, res: Response) {
    try {
      const accountData = req.body;
      
      // Auto-calculate level based on parent
      if (accountData.parentId) {
        const parent = await ChartOfAccounts.findById(accountData.parentId);
        if (parent) {
          accountData.level = parent.level + 1;
        }
      }

      const account = new ChartOfAccounts(accountData);
      await account.save();
      
      res.status(201).json(account);
    } catch (error) {
      res.status(400).json({ error: 'Failed to create account' });
    }
  },

  // Update account
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const account = await ChartOfAccounts.findByIdAndUpdate(
        id, 
        req.body, 
        { new: true, runValidators: true }
      );
      
      if (!account) {
        return res.status(404).json({ error: 'Account not found' });
      }
      
      res.json(account);
    } catch (error) {
      res.status(400).json({ error: 'Failed to update account' });
    }
  },

  // Get account hierarchy
  async getHierarchy(req: Request, res: Response) {
    try {
      const accounts = await ChartOfAccounts.find({ isActive: true }).sort({ code: 1 });
      
      // Build hierarchy tree
      const buildTree = (parentId: string | null = null): any[] => {
        return accounts
          .filter(acc => (parentId ? acc.parentId?.toString() === parentId : !acc.parentId))
          .map(acc => ({
            ...acc.toObject(),
            children: buildTree(acc._id.toString())
          }));
      };
      
      const hierarchy = buildTree();
      res.json(hierarchy);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch account hierarchy' });
    }
  },

  // Get accounts by project
  async getByProject(req: Request, res: Response) {
    try {
      const { projectCode } = req.params;
      const accounts = await ChartOfAccounts.find({
        projectCodes: projectCode,
        isActive: true
      }).sort({ code: 1 });
      
      res.json(accounts);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch project accounts' });
    }
  },

  // Get account balance
  async getBalance(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { fromDate, toDate } = req.query;
      
      // This would typically involve aggregating from ledger entries
      // For now, return the current balance from the account
      const account = await ChartOfAccounts.findById(id);
      
      if (!account) {
        return res.status(404).json({ error: 'Account not found' });
      }
      
      res.json({
        accountId: id,
        accountName: account.name,
        openingBalance: account.openingBalance,
        currentBalance: account.balance,
        period: { fromDate, toDate }
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch account balance' });
    }
  }
};