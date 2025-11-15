import mongoose from 'mongoose';
import Budget from '../models/Budget';
import ProjectJournalEntry from '../models/ProjectLedger';
import JournalEntry from '../models/JournalEntry';
import { Account } from '../models/Account';
import { Ledger } from '../models/Ledger';
import { logger } from './logger';

export interface BudgetLedgerSync {
  projectId: mongoose.Types.ObjectId;
  budgetId: mongoose.Types.ObjectId;
  amount: number;
  category: string;
  transactionType: 'expense' | 'revenue' | 'adjustment';
  description: string;
  accountCode?: string;
}

export class BudgetLedgerIntegration {
  
  // Real-time budget update when project expenses are recorded
  static async syncProjectExpenseToBudget(data: {
    projectId: mongoose.Types.ObjectId;
    amount: number;
    category: 'labor' | 'materials' | 'equipment' | 'overhead';
    description: string;
    accountCode: string;
    userId: mongoose.Types.ObjectId;
  }) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { projectId, amount, category, description, accountCode, userId } = data;

      // 1. Find active project budget
      const budget = await Budget.findOne({
        projectId,
        status: { $in: ['approved', 'active'] }
      }).session(session);

      if (!budget) {
        throw new Error('No active budget found for project');
      }

      // 2. Update budget category spent amount
      const categoryIndex = budget.categories.findIndex(cat => cat.type === category);
      if (categoryIndex === -1) {
        budget.categories.push({
          name: category.charAt(0).toUpperCase() + category.slice(1),
          type: category,
          allocatedAmount: 0,
          spentAmount: amount,
          items: []
        });
      } else {
        budget.categories[categoryIndex].spentAmount += amount;
      }

      // Recalculate budget totals
      budget.actualSpent = budget.categories.reduce((sum, cat) => sum + cat.spentAmount, 0);
      budget.remainingBudget = budget.totalBudget - budget.actualSpent;
      budget.utilizationPercentage = budget.totalBudget > 0 ? (budget.actualSpent / budget.totalBudget) * 100 : 0;

      await budget.save({ session });

      // 3. Create project journal entry
      const projectJournalEntry = await this.createProjectJournalEntry({
        projectId,
        amount,
        description,
        accountCode,
        userId,
        category
      }, session);

      // 4. Create general ledger entry
      await this.createGeneralLedgerEntry({
        amount,
        description,
        accountCode,
        userId,
        projectId,
        reference: projectJournalEntry.entryNumber
      }, session);

      await session.commitTransaction();

      // 5. Emit real-time updates
      const { io } = require('../server');
      if (io) {
        io.emit('budget:updated', { 
          projectId, 
          budgetId: budget._id, 
          budget,
          type: 'expense_recorded'
        });
        io.emit('project:ledger:updated', { 
          projectId, 
          entry: projectJournalEntry 
        });
        io.emit('general:ledger:updated', { 
          accountCode, 
          amount 
        });
      }

      return {
        budget,
        projectJournalEntry,
        success: true
      };

    } catch (error) {
      await session.abortTransaction();
      logger.error('Budget-Ledger sync error:', error);
      throw error;
    } finally {
      session.endSession();
    }
  }

  // Create project journal entry
  private static async createProjectJournalEntry(data: {
    projectId: mongoose.Types.ObjectId;
    amount: number;
    description: string;
    accountCode: string;
    userId: mongoose.Types.ObjectId;
    category: string;
  }, session: mongoose.ClientSession) {
    
    const entryNumber = await this.generateEntryNumber('PJE');
    
    const projectJournalEntry = new ProjectJournalEntry({
      projectId: data.projectId,
      entryNumber,
      date: new Date(),
      reference: `${data.category.toUpperCase()}-${Date.now()}`,
      description: data.description,
      narration: `Project expense - ${data.category}`,
      lines: [
        {
          accountCode: data.accountCode,
          accountName: await this.getAccountName(data.accountCode),
          debit: data.amount,
          credit: 0,
          description: data.description
        },
        {
          accountCode: '1000', // Cash/Bank account
          accountName: 'Cash Account',
          debit: 0,
          credit: data.amount,
          description: `Payment for ${data.description}`
        }
      ],
      totalDebit: data.amount,
      totalCredit: data.amount,
      status: 'posted',
      createdBy: data.userId
    });

    await projectJournalEntry.save({ session });
    return projectJournalEntry;
  }

  // Create general ledger entry
  private static async createGeneralLedgerEntry(data: {
    amount: number;
    description: string;
    accountCode: string;
    userId: mongoose.Types.ObjectId;
    projectId: mongoose.Types.ObjectId;
    reference: string;
  }, session: mongoose.ClientSession) {
    
    const entryNumber = await this.generateEntryNumber('JE');
    
    const journalEntry = new JournalEntry({
      entryNumber,
      date: new Date(),
      reference: data.reference,
      description: `Project expense: ${data.description}`,
      lines: [
        {
          accountId: await this.getAccountId(data.accountCode),
          debit: data.amount,
          credit: 0,
          description: data.description
        },
        {
          accountId: await this.getAccountId('1000'),
          debit: 0,
          credit: data.amount,
          description: `Payment for ${data.description}`
        }
      ],
      totalDebit: data.amount,
      totalCredit: data.amount,
      isPosted: true,
      createdBy: data.userId
    });

    await journalEntry.save({ session });

    // Update account balances and create ledger entries
    await this.updateAccountBalances(journalEntry, session);
    
    return journalEntry;
  }

  // Update account balances and create ledger entries
  private static async updateAccountBalances(journalEntry: any, session: mongoose.ClientSession) {
    for (const line of journalEntry.lines) {
      const account = await Account.findById(line.accountId).session(session);
      if (!account) continue;

      // Calculate new balance
      let newBalance = account.balance;
      if (['asset', 'expense'].includes(account.type)) {
        newBalance += line.debit - line.credit;
      } else {
        newBalance += line.credit - line.debit;
      }

      // Update account balance
      await Account.findByIdAndUpdate(
        line.accountId,
        { balance: newBalance },
        { session }
      );

      // Create ledger entry
      await Ledger.create([{
        accountId: line.accountId,
        date: journalEntry.date,
        description: line.description,
        debit: line.debit,
        credit: line.credit,
        balance: newBalance,
        journalEntryId: journalEntry._id,
        reference: journalEntry.reference
      }], { session });
    }
  }

  // Budget variance analysis with real-time alerts
  static async analyzeBudgetVariance(projectId: mongoose.Types.ObjectId) {
    try {
      const budget = await Budget.findOne({
        projectId,
        status: { $in: ['approved', 'active'] }
      });

      if (!budget) return null;

      const variance = budget.totalBudget - budget.actualSpent;
      const variancePercentage = budget.totalBudget > 0 ? (variance / budget.totalBudget) * 100 : 0;

      const analysis = {
        budgetId: budget._id,
        projectId,
        totalBudget: budget.totalBudget,
        actualSpent: budget.actualSpent,
        variance,
        variancePercentage,
        status: this.getBudgetStatus(budget.utilizationPercentage),
        alerts: this.generateBudgetAlerts(budget),
        categoryAnalysis: budget.categories.map(cat => ({
          type: cat.type,
          allocated: cat.allocatedAmount,
          spent: cat.spentAmount,
          variance: cat.allocatedAmount - cat.spentAmount,
          utilizationPercentage: cat.allocatedAmount > 0 ? (cat.spentAmount / cat.allocatedAmount) * 100 : 0
        }))
      };

      // Emit real-time variance analysis
      const { io } = require('../server');
      if (io) {
        io.emit('budget:variance:analysis', analysis);
      }

      return analysis;
    } catch (error) {
      logger.error('Budget variance analysis error:', error);
      throw error;
    }
  }

  // Generate budget status
  private static getBudgetStatus(utilizationPercentage: number): string {
    if (utilizationPercentage > 100) return 'over-budget';
    if (utilizationPercentage > 90) return 'at-risk';
    if (utilizationPercentage > 75) return 'on-track';
    return 'under-utilized';
  }

  // Generate budget alerts
  private static generateBudgetAlerts(budget: any): string[] {
    const alerts: string[] = [];
    
    if (budget.utilizationPercentage > 100) {
      alerts.push(`Budget exceeded by ${(budget.utilizationPercentage - 100).toFixed(1)}%`);
    } else if (budget.utilizationPercentage > 90) {
      alerts.push(`Budget utilization at ${budget.utilizationPercentage.toFixed(1)}% - Monitor closely`);
    }

    budget.categories.forEach((cat: any) => {
      const catUtilization = cat.allocatedAmount > 0 ? (cat.spentAmount / cat.allocatedAmount) * 100 : 0;
      if (catUtilization > 100) {
        alerts.push(`${cat.type} category over budget by ${(catUtilization - 100).toFixed(1)}%`);
      }
    });

    return alerts;
  }

  // Sync all project budgets with ledger data
  static async syncAllProjectBudgets() {
    try {
      const budgets = await Budget.find({ 
        budgetType: 'project',
        status: { $in: ['approved', 'active'] }
      });

      const syncResults = [];

      for (const budget of budgets) {
        try {
          // Get project journal entries
          const projectEntries = await ProjectJournalEntry.find({
            projectId: budget.projectId,
            status: { $in: ['posted', 'approved'] }
          });

          // Calculate actual spent from project ledger
          const actualSpent = projectEntries.reduce((sum, entry) => {
            return sum + entry.lines.reduce((lineSum, line) => lineSum + line.debit, 0);
          }, 0);

          // Update budget with actual data
          budget.actualSpent = actualSpent;
          budget.remainingBudget = budget.totalBudget - actualSpent;
          budget.utilizationPercentage = budget.totalBudget > 0 ? (actualSpent / budget.totalBudget) * 100 : 0;

          await budget.save();

          syncResults.push({
            budgetId: budget._id,
            projectId: budget.projectId,
            synced: true,
            actualSpent
          });

        } catch (error) {
          syncResults.push({
            budgetId: budget._id,
            projectId: budget.projectId,
            synced: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      // Emit sync completion
      const { io } = require('../server');
      if (io) {
        io.emit('budget:sync:completed', { 
          totalSynced: syncResults.filter(r => r.synced).length,
          totalErrors: syncResults.filter(r => !r.synced).length,
          results: syncResults
        });
      }

      return syncResults;
    } catch (error) {
      logger.error('Budget sync error:', error);
      throw error;
    }
  }

  // Real-time budget monitoring
  static async startBudgetMonitoring() {
    setInterval(async () => {
      try {
        const activeBudgets = await Budget.find({
          status: { $in: ['approved', 'active'] }
        });

        for (const budget of activeBudgets) {
          const analysis = await this.analyzeBudgetVariance(budget.projectId);
          
          // Check for critical alerts
          if (analysis && analysis.alerts.length > 0) {
            const { io } = require('../server');
            if (io) {
              io.emit('budget:alert', {
                budgetId: budget._id,
                projectId: budget.projectId,
                projectName: budget.projectName,
                alerts: analysis.alerts,
                severity: budget.utilizationPercentage > 100 ? 'critical' : 'warning',
                timestamp: new Date()
              });
            }
          }
        }
      } catch (error) {
        logger.error('Budget monitoring error:', error);
      }
    }, 300000); // Check every 5 minutes
  }

  // Helper methods
  private static async generateEntryNumber(prefix: string): Promise<string> {
    const { generateEntryNumber } = require('./numberGenerator');
    return generateEntryNumber(prefix);
  }

  private static async getAccountName(accountCode: string): Promise<string> {
    const account = await Account.findOne({ code: accountCode });
    return account ? account.name : 'Unknown Account';
  }

  private static async getAccountId(accountCode: string): Promise<mongoose.Types.ObjectId> {
    const account = await Account.findOne({ code: accountCode });
    if (!account) {
      throw new Error(`Account with code ${accountCode} not found`);
    }
    return account._id;
  }

  // Generate comprehensive financial report
  static async generateIntegratedFinancialReport(projectId: mongoose.Types.ObjectId) {
    try {
      const budget = await Budget.findOne({
        projectId,
        status: { $in: ['approved', 'active'] }
      });

      const projectEntries = await ProjectJournalEntry.find({
        projectId,
        status: { $in: ['posted', 'approved'] }
      });

      const generalLedgerEntries = await Ledger.find({
        reference: { $regex: projectId.toString() }
      }).populate('accountId', 'code name type');

      const report = {
        projectId,
        budget: budget ? {
          totalBudget: budget.totalBudget,
          actualSpent: budget.actualSpent,
          remainingBudget: budget.remainingBudget,
          utilizationPercentage: budget.utilizationPercentage,
          categories: budget.categories
        } : null,
        projectLedger: {
          totalEntries: projectEntries.length,
          totalDebits: projectEntries.reduce((sum, entry) => sum + entry.totalDebit, 0),
          totalCredits: projectEntries.reduce((sum, entry) => sum + entry.totalCredit, 0),
          entries: projectEntries
        },
        generalLedger: {
          affectedAccounts: generalLedgerEntries.length,
          entries: generalLedgerEntries
        },
        variance: budget ? {
          budgetVsActual: budget.totalBudget - budget.actualSpent,
          variancePercentage: budget.totalBudget > 0 ? ((budget.totalBudget - budget.actualSpent) / budget.totalBudget) * 100 : 0
        } : null,
        generatedAt: new Date()
      };

      return report;
    } catch (error) {
      logger.error('Integrated financial report error:', error);
      throw error;
    }
  }
}