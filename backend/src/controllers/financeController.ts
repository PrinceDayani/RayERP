import { Request, Response } from 'express';
import Account from '../models/Account';
import Transaction from '../models/Transaction';
import Invoice from '../models/Invoice';
import Payment from '../models/Payment';
import Budget from '../models/Budget';
import JournalEntry from '../models/JournalEntry';
import { Ledger } from '../models/Ledger';
import mongoose from 'mongoose';

// Dashboard Summary
export const getFinanceDashboard = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.query;
    const filter: any = {};
    if (projectId) filter.projectId = projectId;

    // Get key financial metrics
    const [
      totalAccounts,
      totalTransactions,
      totalInvoices,
      totalPayments,
      totalBudgets,
      recentTransactions,
      accountBalances
    ] = await Promise.all([
      Account.countDocuments({ ...filter, isActive: true }),
      Transaction.countDocuments({ ...filter, status: 'posted' }),
      Invoice.countDocuments(filter),
      Payment.countDocuments(filter),
      Budget.countDocuments(filter),
      Transaction.find({ ...filter, status: 'posted' })
        .sort({ date: -1 })
        .limit(10)
        .populate('entries.accountId', 'name code'),
      Account.find({ ...filter, isActive: true })
        .select('name code balance type')
        .sort({ code: 1 })
    ]);

    // Calculate totals by account type
    const balancesByType = accountBalances.reduce((acc: any, account: any) => {
      if (!acc[account.type]) acc[account.type] = 0;
      acc[account.type] += account.balance;
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        summary: {
          totalAccounts,
          totalTransactions,
          totalInvoices,
          totalPayments,
          totalBudgets
        },
        balancesByType,
        recentTransactions,
        accountBalances: accountBalances.slice(0, 20)
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Trial Balance
export const getTrialBalance = async (req: Request, res: Response) => {
  try {
    const { projectId, asOfDate } = req.query;
    const filter: any = { isActive: true };
    if (projectId) filter.projectId = projectId;

    const accounts = await Account.find(filter)
      .select('code name type balance')
      .sort({ code: 1 });

    const trialBalance = accounts.map(account => ({
      code: account.code,
      name: account.name,
      type: account.type,
      debit: account.balance >= 0 ? account.balance : 0,
      credit: account.balance < 0 ? Math.abs(account.balance) : 0
    }));

    const totalDebits = trialBalance.reduce((sum, acc) => sum + acc.debit, 0);
    const totalCredits = trialBalance.reduce((sum, acc) => sum + acc.credit, 0);

    res.json({
      success: true,
      data: {
        accounts: trialBalance,
        totals: {
          debits: totalDebits,
          credits: totalCredits,
          difference: totalDebits - totalCredits
        },
        asOfDate: asOfDate || new Date()
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Balance Sheet
export const getBalanceSheet = async (req: Request, res: Response) => {
  try {
    const { projectId, asOfDate } = req.query;
    const filter: any = { isActive: true };
    if (projectId) filter.projectId = projectId;

    const accounts = await Account.find(filter)
      .select('code name type subType balance')
      .sort({ code: 1 });

    const assets = accounts.filter(acc => acc.type === 'asset');
    const liabilities = accounts.filter(acc => acc.type === 'liability');
    const equity = accounts.filter(acc => acc.type === 'equity');

    const totalAssets = assets.reduce((sum, acc) => sum + acc.balance, 0);
    const totalLiabilities = liabilities.reduce((sum, acc) => sum + acc.balance, 0);
    const totalEquity = equity.reduce((sum, acc) => sum + acc.balance, 0);

    res.json({
      success: true,
      data: {
        assets: {
          accounts: assets,
          total: totalAssets
        },
        liabilities: {
          accounts: liabilities,
          total: totalLiabilities
        },
        equity: {
          accounts: equity,
          total: totalEquity
        },
        totals: {
          assets: totalAssets,
          liabilitiesAndEquity: totalLiabilities + totalEquity,
          difference: totalAssets - (totalLiabilities + totalEquity)
        },
        asOfDate: asOfDate || new Date()
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Profit & Loss Statement
export const getProfitLoss = async (req: Request, res: Response) => {
  try {
    const { projectId, startDate, endDate } = req.query;
    const filter: any = { isActive: true };
    if (projectId) filter.projectId = projectId;

    const accounts = await Account.find(filter)
      .select('code name type subType balance')
      .sort({ code: 1 });

    const revenue = accounts.filter(acc => acc.type === 'revenue');
    const expenses = accounts.filter(acc => acc.type === 'expense');

    const totalRevenue = revenue.reduce((sum, acc) => sum + acc.balance, 0);
    const totalExpenses = expenses.reduce((sum, acc) => sum + acc.balance, 0);
    const netIncome = totalRevenue - totalExpenses;

    res.json({
      success: true,
      data: {
        revenue: {
          accounts: revenue,
          total: totalRevenue
        },
        expenses: {
          accounts: expenses,
          total: totalExpenses
        },
        netIncome,
        period: {
          startDate: startDate || new Date(new Date().getFullYear(), 0, 1),
          endDate: endDate || new Date()
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Cash Flow Statement
export const getCashFlow = async (req: Request, res: Response) => {
  try {
    const { projectId, startDate, endDate } = req.query;
    const filter: any = { status: 'posted' };
    if (projectId) filter.projectId = projectId;

    const dateFilter: any = {};
    if (startDate) dateFilter.$gte = new Date(startDate as string);
    if (endDate) dateFilter.$lte = new Date(endDate as string);
    if (Object.keys(dateFilter).length > 0) filter.date = dateFilter;

    const transactions = await Transaction.find(filter)
      .populate('entries.accountId', 'name type')
      .sort({ date: -1 });

    // Categorize cash flows
    const operatingCashFlow: any[] = [];
    const investingCashFlow: any[] = [];
    const financingCashFlow: any[] = [];

    transactions.forEach(transaction => {
      transaction.entries.forEach(entry => {
        const account = entry.accountId as any;
        if (account && account.type === 'asset' && account.name.toLowerCase().includes('cash')) {
          const cashFlow = {
            date: transaction.date,
            description: transaction.description,
            amount: entry.debit - entry.credit,
            type: transaction.transactionType
          };

          // Categorize based on transaction type
          if (['invoice', 'bill', 'payment', 'receipt'].includes(transaction.transactionType)) {
            operatingCashFlow.push(cashFlow);
          } else if (transaction.transactionType === 'adjustment') {
            investingCashFlow.push(cashFlow);
          } else {
            financingCashFlow.push(cashFlow);
          }
        }
      });
    });

    const totalOperating = operatingCashFlow.reduce((sum, cf) => sum + cf.amount, 0);
    const totalInvesting = investingCashFlow.reduce((sum, cf) => sum + cf.amount, 0);
    const totalFinancing = financingCashFlow.reduce((sum, cf) => sum + cf.amount, 0);

    res.json({
      success: true,
      data: {
        operating: {
          items: operatingCashFlow,
          total: totalOperating
        },
        investing: {
          items: investingCashFlow,
          total: totalInvesting
        },
        financing: {
          items: financingCashFlow,
          total: totalFinancing
        },
        netCashFlow: totalOperating + totalInvesting + totalFinancing,
        period: {
          startDate: startDate || new Date(new Date().getFullYear(), 0, 1),
          endDate: endDate || new Date()
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Account Ledger
export const getAccountLedger = async (req: Request, res: Response) => {
  try {
    const { accountId } = req.params;
    const { startDate, endDate, limit = 50, page = 1 } = req.query;

    const filter: any = { accountId };
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate as string);
      if (endDate) filter.date.$lte = new Date(endDate as string);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [ledgerEntries, total, account] = await Promise.all([
      Ledger.find(filter)
        .sort({ date: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('journalEntryId', 'entryNumber description'),
      Ledger.countDocuments(filter),
      Account.findById(accountId).select('name code type balance')
    ]);

    if (!account) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }

    res.json({
      success: true,
      data: {
        account,
        entries: ledgerEntries,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Budget vs Actual Report
export const getBudgetVsActual = async (req: Request, res: Response) => {
  try {
    const { projectId, fiscalYear } = req.query;
    const filter: any = {};
    if (projectId) filter.projectId = projectId;
    if (fiscalYear) filter.fiscalYear = Number(fiscalYear);

    const budgets = await Budget.find(filter)
      .populate('projectId', 'name');

    const budgetAnalysis = budgets.map(budget => ({
      id: budget._id,
      projectName: budget.projectName,
      fiscalYear: budget.fiscalYear,
      totalBudget: budget.totalBudget,
      actualSpent: budget.actualSpent,
      remainingBudget: budget.remainingBudget,
      utilizationPercentage: budget.utilizationPercentage,
      variance: budget.totalBudget - budget.actualSpent,
      status: budget.status,
      categories: budget.categories.map(cat => ({
        name: cat.name,
        type: cat.type,
        allocated: cat.allocatedAmount,
        spent: cat.spentAmount,
        variance: cat.allocatedAmount - cat.spentAmount
      }))
    }));

    res.json({
      success: true,
      data: budgetAnalysis
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Financial Health Metrics
export const getFinancialHealth = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.query;
    const filter: any = { isActive: true };
    if (projectId) filter.projectId = projectId;

    const [accounts, invoices, payments] = await Promise.all([
      Account.find(filter),
      Invoice.find(projectId ? { projectId } : {}),
      Payment.find(projectId ? { projectId } : {})
    ]);

    // Calculate key ratios
    const totalAssets = accounts.filter(acc => acc.type === 'asset').reduce((sum, acc) => sum + acc.balance, 0);
    const totalLiabilities = accounts.filter(acc => acc.type === 'liability').reduce((sum, acc) => sum + acc.balance, 0);
    const totalRevenue = accounts.filter(acc => acc.type === 'revenue').reduce((sum, acc) => sum + acc.balance, 0);
    const totalExpenses = accounts.filter(acc => acc.type === 'expense').reduce((sum, acc) => sum + acc.balance, 0);

    const currentRatio = totalLiabilities > 0 ? totalAssets / totalLiabilities : 0;
    const profitMargin = totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 : 0;
    
    // Accounts Receivable
    const totalInvoiceAmount = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const totalPaidAmount = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
    const accountsReceivable = totalInvoiceAmount - totalPaidAmount;

    // Payment metrics
    const averagePaymentTime = payments.length > 0 
      ? payments.reduce((sum, payment) => {
          const daysDiff = Math.floor((payment.paymentDate.getTime() - payment.createdAt.getTime()) / (1000 * 60 * 60 * 24));
          return sum + daysDiff;
        }, 0) / payments.length 
      : 0;

    res.json({
      success: true,
      data: {
        ratios: {
          currentRatio: Number(currentRatio.toFixed(2)),
          profitMargin: Number(profitMargin.toFixed(2))
        },
        receivables: {
          total: accountsReceivable,
          averageCollectionDays: averagePaymentTime
        },
        summary: {
          totalAssets,
          totalLiabilities,
          totalRevenue,
          totalExpenses,
          netIncome: totalRevenue - totalExpenses
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export default {
  getFinanceDashboard,
  getTrialBalance,
  getBalanceSheet,
  getProfitLoss,
  getCashFlow,
  getAccountLedger,
  getBudgetVsActual,
  getFinancialHealth
};