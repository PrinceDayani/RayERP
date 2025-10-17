import { Request, Response } from 'express';
import { ChartOfAccounts } from '../models/ChartOfAccounts';
import { JournalEntry } from '../models/JournalEntry';
import { Ledger } from '../models/Ledger';
import { SubsidiaryLedger } from '../models/SubsidiaryLedger';
import { WIPLedger } from '../models/WIPLedger';
import { CostCenter } from '../models/CostCenter';
import { FiscalYear } from '../models/FiscalYear';
import mongoose from 'mongoose';

export const generalLedgerController = {
  // Get Trial Balance
  async getTrialBalance(req: Request, res: Response) {
    try {
      const { projectId, fromDate, toDate, consolidated = false } = req.query;
      
      const matchStage: any = {};
      if (fromDate || toDate) {
        matchStage.date = {};
        if (fromDate) matchStage.date.$gte = new Date(fromDate as string);
        if (toDate) matchStage.date.$lte = new Date(toDate as string);
      }
      
      if (projectId && !consolidated) {
        matchStage.projectId = new mongoose.Types.ObjectId(projectId as string);
      }

      const trialBalance = await Ledger.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$accountId',
            totalDebit: { $sum: '$debit' },
            totalCredit: { $sum: '$credit' },
            closingBalance: { $last: '$balance' }
          }
        },
        {
          $lookup: {
            from: 'chartofaccounts',
            localField: '_id',
            foreignField: '_id',
            as: 'account'
          }
        },
        { $unwind: '$account' },
        {
          $project: {
            accountCode: '$account.code',
            accountName: '$account.name',
            accountType: '$account.type',
            openingBalance: '$account.openingBalance',
            totalDebit: 1,
            totalCredit: 1,
            closingBalance: 1
          }
        },
        { $sort: { accountCode: 1 } }
      ]);

      const summary = {
        totalDebits: trialBalance.reduce((sum, acc) => sum + acc.totalDebit, 0),
        totalCredits: trialBalance.reduce((sum, acc) => sum + acc.totalCredit, 0),
        accountCount: trialBalance.length
      };

      res.json({ trialBalance, summary });
    } catch (error) {
      res.status(500).json({ error: 'Failed to generate trial balance' });
    }
  },

  // Get Ledger Statement
  async getLedgerStatement(req: Request, res: Response) {
    try {
      const { accountId } = req.params;
      const { fromDate, toDate, projectId } = req.query;
      
      const matchStage: any = { accountId: new mongoose.Types.ObjectId(accountId) };
      if (fromDate || toDate) {
        matchStage.date = {};
        if (fromDate) matchStage.date.$gte = new Date(fromDate as string);
        if (toDate) matchStage.date.$lte = new Date(toDate as string);
      }

      const ledgerEntries = await Ledger.find(matchStage)
        .populate('journalEntryId', 'entryNumber reference sourceModule')
        .populate('accountId', 'code name type')
        .sort({ date: 1, createdAt: 1 });

      const account = await ChartOfAccounts.findById(accountId);
      
      res.json({
        account: {
          code: account?.code,
          name: account?.name,
          type: account?.type,
          openingBalance: account?.openingBalance
        },
        entries: ledgerEntries,
        summary: {
          totalDebits: ledgerEntries.reduce((sum, entry) => sum + entry.debit, 0),
          totalCredits: ledgerEntries.reduce((sum, entry) => sum + entry.credit, 0),
          closingBalance: ledgerEntries.length > 0 ? ledgerEntries[ledgerEntries.length - 1].balance : account?.openingBalance || 0
        }
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to generate ledger statement' });
    }
  },

  // Get Balance Sheet
  async getBalanceSheet(req: Request, res: Response) {
    try {
      const { asOfDate, projectId } = req.query;
      const date = asOfDate ? new Date(asOfDate as string) : new Date();
      
      const matchStage: any = { date: { $lte: date } };
      if (projectId) {
        matchStage.projectId = new mongoose.Types.ObjectId(projectId as string);
      }

      const balances = await Ledger.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$accountId',
            balance: { $last: '$balance' }
          }
        },
        {
          $lookup: {
            from: 'chartofaccounts',
            localField: '_id',
            foreignField: '_id',
            as: 'account'
          }
        },
        { $unwind: '$account' },
        {
          $group: {
            _id: '$account.type',
            accounts: {
              $push: {
                code: '$account.code',
                name: '$account.name',
                balance: '$balance'
              }
            },
            totalBalance: { $sum: '$balance' }
          }
        }
      ]);

      const balanceSheet = {
        assets: balances.find(b => b._id === 'asset') || { accounts: [], totalBalance: 0 },
        liabilities: balances.find(b => b._id === 'liability') || { accounts: [], totalBalance: 0 },
        equity: balances.find(b => b._id === 'equity') || { accounts: [], totalBalance: 0 }
      };

      res.json({
        balanceSheet,
        asOfDate: date,
        totals: {
          totalAssets: balanceSheet.assets.totalBalance,
          totalLiabilities: balanceSheet.liabilities.totalBalance,
          totalEquity: balanceSheet.equity.totalBalance
        }
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to generate balance sheet' });
    }
  },

  // Get Profit & Loss Statement
  async getProfitLoss(req: Request, res: Response) {
    try {
      const { fromDate, toDate, projectId } = req.query;
      
      const matchStage: any = {};
      if (fromDate || toDate) {
        matchStage.date = {};
        if (fromDate) matchStage.date.$gte = new Date(fromDate as string);
        if (toDate) matchStage.date.$lte = new Date(toDate as string);
      }
      if (projectId) {
        matchStage.projectId = new mongoose.Types.ObjectId(projectId as string);
      }

      const plData = await Ledger.aggregate([
        { $match: matchStage },
        {
          $lookup: {
            from: 'chartofaccounts',
            localField: 'accountId',
            foreignField: '_id',
            as: 'account'
          }
        },
        { $unwind: '$account' },
        {
          $match: {
            'account.type': { $in: ['income', 'expense'] }
          }
        },
        {
          $group: {
            _id: {
              type: '$account.type',
              accountId: '$accountId',
              accountCode: '$account.code',
              accountName: '$account.name'
            },
            totalDebit: { $sum: '$debit' },
            totalCredit: { $sum: '$credit' },
            netAmount: {
              $sum: {
                $cond: [
                  { $eq: ['$account.type', 'income'] },
                  { $subtract: ['$credit', '$debit'] },
                  { $subtract: ['$debit', '$credit'] }
                ]
              }
            }
          }
        },
        {
          $group: {
            _id: '$_id.type',
            accounts: {
              $push: {
                code: '$_id.accountCode',
                name: '$_id.accountName',
                amount: '$netAmount'
              }
            },
            total: { $sum: '$netAmount' }
          }
        }
      ]);

      const income = plData.find(p => p._id === 'income') || { accounts: [], total: 0 };
      const expenses = plData.find(p => p._id === 'expense') || { accounts: [], total: 0 };
      const netProfit = income.total - expenses.total;

      res.json({
        income,
        expenses,
        netProfit,
        period: { fromDate, toDate }
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to generate P&L statement' });
    }
  },

  // Get Project Cost Report
  async getProjectCostReport(req: Request, res: Response) {
    try {
      const { projectId } = req.params;
      const { fromDate, toDate } = req.query;
      
      const matchStage: any = { projectId: new mongoose.Types.ObjectId(projectId) };
      if (fromDate || toDate) {
        matchStage.date = {};
        if (fromDate) matchStage.date.$gte = new Date(fromDate as string);
        if (toDate) matchStage.date.$lte = new Date(toDate as string);
      }

      // Get WIP costs by cost head
      const wipCosts = await WIPLedger.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$costHead',
            actualCost: { $sum: '$amount' },
            capitalizedCost: { $sum: { $cond: ['$isCapitalized', '$capitalizedAmount', 0] } }
          }
        }
      ]);

      // Get budget vs actual from cost centers
      const costCenters = await CostCenter.find({ projectId }).select('name budget actualCost committedCost');
      
      // Get project ledger entries
      const ledgerEntries = await Ledger.find(matchStage)
        .populate('accountId', 'code name type')
        .populate('journalEntryId', 'entryNumber reference')
        .sort({ date: -1 });

      const costSummary = {
        material: wipCosts.find(w => w._id === 'material')?.actualCost || 0,
        labour: wipCosts.find(w => w._id === 'labour')?.actualCost || 0,
        equipment: wipCosts.find(w => w._id === 'equipment')?.actualCost || 0,
        subcontractor: wipCosts.find(w => w._id === 'subcontractor')?.actualCost || 0,
        overhead: wipCosts.find(w => w._id === 'overhead')?.actualCost || 0
      };

      const totalActualCost = Object.values(costSummary).reduce((sum, cost) => sum + cost, 0);
      const totalBudget = costCenters.reduce((sum, cc) => sum + cc.budget, 0);
      const totalCommitted = costCenters.reduce((sum, cc) => sum + cc.committedCost, 0);

      res.json({
        projectId,
        costSummary,
        budgetAnalysis: {
          totalBudget,
          totalActualCost,
          totalCommitted,
          variance: totalBudget - totalActualCost,
          utilizationPercent: totalBudget > 0 ? (totalActualCost / totalBudget) * 100 : 0
        },
        costCenters,
        recentTransactions: ledgerEntries.slice(0, 20)
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to generate project cost report' });
    }
  },

  // Get Aging Report
  async getAgingReport(req: Request, res: Response) {
    try {
      const { type, asOfDate } = req.query;
      const date = asOfDate ? new Date(asOfDate as string) : new Date();
      
      if (!type || !['vendor', 'customer'].includes(type as string)) {
        return res.status(400).json({ error: 'Valid type (vendor/customer) is required' });
      }

      const agingData = await SubsidiaryLedger.aggregate([
        {
          $match: {
            type: type as string,
            date: { $lte: date },
            balance: { $ne: 0 }
          }
        },
        {
          $lookup: {
            from: type === 'vendor' ? 'contacts' : 'contacts',
            localField: 'entityId',
            foreignField: '_id',
            as: 'entity'
          }
        },
        { $unwind: '$entity' },
        {
          $addFields: {
            agingDays: {
              $divide: [
                { $subtract: [date, '$dueDate'] },
                1000 * 60 * 60 * 24
              ]
            }
          }
        },
        {
          $addFields: {
            agingBucket: {
              $switch: {
                branches: [
                  { case: { $lte: ['$agingDays', 30] }, then: '0-30' },
                  { case: { $lte: ['$agingDays', 60] }, then: '31-60' },
                  { case: { $lte: ['$agingDays', 90] }, then: '61-90' },
                  { case: { $lte: ['$agingDays', 120] }, then: '91-120' }
                ],
                default: '120+'
              }
            }
          }
        },
        {
          $group: {
            _id: {
              entityId: '$entityId',
              entityName: '$entity.name',
              agingBucket: '$agingBucket'
            },
            amount: { $sum: '$balance' }
          }
        },
        {
          $group: {
            _id: {
              entityId: '$_id.entityId',
              entityName: '$_id.entityName'
            },
            aging: {
              $push: {
                bucket: '$_id.agingBucket',
                amount: '$amount'
              }
            },
            totalAmount: { $sum: '$amount' }
          }
        }
      ]);

      res.json({
        type,
        asOfDate: date,
        agingData,
        summary: {
          totalOutstanding: agingData.reduce((sum, item) => sum + item.totalAmount, 0),
          entityCount: agingData.length
        }
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to generate aging report' });
    }
  },

  // Get Cash Flow Statement
  async getCashFlowStatement(req: Request, res: Response) {
    try {
      const { fromDate, toDate, projectId } = req.query;
      
      const matchStage: any = {};
      if (fromDate || toDate) {
        matchStage.date = {};
        if (fromDate) matchStage.date.$gte = new Date(fromDate as string);
        if (toDate) matchStage.date.$lte = new Date(toDate as string);
      }
      if (projectId) {
        matchStage.projectId = new mongoose.Types.ObjectId(projectId as string);
      }

      // This is a simplified cash flow - in practice, you'd need more sophisticated logic
      const cashFlowData = await Ledger.aggregate([
        { $match: matchStage },
        {
          $lookup: {
            from: 'chartofaccounts',
            localField: 'accountId',
            foreignField: '_id',
            as: 'account'
          }
        },
        { $unwind: '$account' },
        {
          $addFields: {
            cashFlowCategory: {
              $switch: {
                branches: [
                  { case: { $in: ['$account.subType', ['Cash', 'Bank']] }, then: 'operating' },
                  { case: { $eq: ['$account.type', 'asset'] }, then: 'investing' },
                  { case: { $in: ['$account.type', ['liability', 'equity']] }, then: 'financing' }
                ],
                default: 'operating'
              }
            }
          }
        },
        {
          $group: {
            _id: '$cashFlowCategory',
            inflow: { $sum: '$credit' },
            outflow: { $sum: '$debit' },
            netFlow: { $sum: { $subtract: ['$credit', '$debit'] } }
          }
        }
      ]);

      const operating = cashFlowData.find(cf => cf._id === 'operating') || { inflow: 0, outflow: 0, netFlow: 0 };
      const investing = cashFlowData.find(cf => cf._id === 'investing') || { inflow: 0, outflow: 0, netFlow: 0 };
      const financing = cashFlowData.find(cf => cf._id === 'financing') || { inflow: 0, outflow: 0, netFlow: 0 };

      const netCashFlow = operating.netFlow + investing.netFlow + financing.netFlow;

      res.json({
        operating,
        investing,
        financing,
        netCashFlow,
        period: { fromDate, toDate }
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to generate cash flow statement' });
    }
  },

  // Get GL Dashboard Data
  async getDashboard(req: Request, res: Response) {
    try {
      const { projectId } = req.query;
      const currentDate = new Date();
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      
      const matchStage: any = { date: { $gte: startOfMonth } };
      if (projectId) {
        matchStage.projectId = new mongoose.Types.ObjectId(projectId as string);
      }

      // Get current month summary
      const monthlyData = await Ledger.aggregate([
        { $match: matchStage },
        {
          $lookup: {
            from: 'chartofaccounts',
            localField: 'accountId',
            foreignField: '_id',
            as: 'account'
          }
        },
        { $unwind: '$account' },
        {
          $group: {
            _id: '$account.type',
            totalDebit: { $sum: '$debit' },
            totalCredit: { $sum: '$credit' }
          }
        }
      ]);

      const totalExpenses = monthlyData.find(m => m._id === 'expense')?.totalDebit || 0;
      const totalRevenue = monthlyData.find(m => m._id === 'income')?.totalCredit || 0;
      const totalAssets = monthlyData.find(m => m._id === 'asset')?.totalDebit || 0;

      // Get WIP summary
      const wipSummary = await WIPLedger.aggregate([
        { $match: projectId ? { projectId: new mongoose.Types.ObjectId(projectId as string) } : {} },
        {
          $group: {
            _id: null,
            totalWIP: { $sum: '$amount' },
            capitalizedAmount: { $sum: { $cond: ['$isCapitalized', '$capitalizedAmount', 0] } }
          }
        }
      ]);

      const wip = wipSummary[0] || { totalWIP: 0, capitalizedAmount: 0 };

      // Get recent journal entries
      const recentEntries = await JournalEntry.find(matchStage)
        .populate('createdBy', 'name')
        .sort({ date: -1 })
        .limit(5);

      res.json({
        kpis: {
          totalExpenses,
          totalRevenue,
          totalAssets,
          netProfit: totalRevenue - totalExpenses,
          totalWIP: wip.totalWIP,
          capitalizedAmount: wip.capitalizedAmount
        },
        recentEntries,
        period: {
          from: startOfMonth,
          to: currentDate
        }
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
  }
};